package chat

import (
	chatservice "blindly/internal/chat_service"
	"blindly/internal/models"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func FlushHandler(c *fiber.Ctx) error {
	signature := c.Get("Upstash-Signature")
	if signature == "" {
		log.Println("Missing Upstash-Signature header")
		return fiber.ErrUnauthorized
	}

	backendURL := config.GetEnvRaw("BACKEND_URL")
	flushURL := fmt.Sprintf("%s/v1/chat/flush", backendURL)

	if err := chatservice.VerifyQStashSignature(signature, c.Body(), flushURL); err != nil {
		log.Printf("Invalid Upstash-Signature header: %v", err)
		return fiber.ErrUnauthorized
	}

	req := new(chatservice.FlushRequest)
	if err := c.BodyParser(req); err != nil {
		log.Println("Failed to parse request body")
		return fiber.ErrBadRequest
	}

	if req.ChatId == "" {
		log.Println("Missing chat ID")
		return fiber.ErrBadRequest
	}

	// Flush is an internal operation, use NewStoreWithoutAuth
	store := chatservice.NewStoreWithoutAuth(req.ChatId)
	defer store.Close()

	if err := store.FlushMessages(req.FlushToken); err != nil {
		log.Printf("flush failed for chat %s: %v", req.ChatId, err)
		return fiber.ErrServiceUnavailable
	}

	return c.Status(http.StatusOK).JSON(fiber.Map{"success": true})
}

type events string

const (
	// Chat events
	messageSent     events = "message_sent"
	messageReceived events = "message_received"
	messageSeen     events = "message_seen"
	// messageDeleted  events = "message_deleted" -> Future feature
	messageUpdated  events = "message_updated"
	typingStarted   events = "typing_started"
	typingStopped   events = "typing_stopped"
	reactionAdded   events = "reaction_added"
	reactionRemoved events = "reaction_removed"

	// Query events
	queryMessages events = "query_messages"

	// Service events
	errorEvent           events = "error"
	unauthorizedEvent    events = "unauthorized"
	endChatEvent         events = "end_chat"
	messagesQuerySuccess events = "messages_query_success"
)

type reaction struct {
	MessageId string `json:"message_id"`
	Reaction  string `json:"reaction"`
}

type messageQuery struct {
	Limit    int    `json:"limit"`
	BeforeId string `json:"before_id"`
}

type incomingMedia struct {
	Type      string    `json:"type"`
	Url       string    `json:"url"`
	CreatedAt time.Time `json:"created_at"`
}

type incomingMessage struct {
	Id        *string            `json:"id"` //For updating
	Type      models.MessageType `json:"type"`
	Content   string             `json:"content"`
	Media     []incomingMedia    `json:"media"`
	CreatedAt time.Time          `json:"created_at"`
}

var incoming struct {
	Message      *incomingMessage `json:"message"`
	Reaction     *reaction        `json:"reaction"`
	Event        events           `json:"event"`
	MarkSeen     []string         `json:"mark_seen"`
	MessageQuery *messageQuery    `json:"message_query"`
}

type outgoing struct {
	Messages []models.Message `json:"message"`
	Event    events           `json:"event"`
	Error    string           `json:"error"`
}

func WSHandler(c *websocket.Conn) {
	chatId := c.Params("chatId")
	if chatId == "" {
		c.Close()
		return
	}

	userId, ok := c.Locals("uid").(string)
	if !ok {
		c.Close()
		return
	}

	store, err := chatservice.NewStore(chatId, userId)
	if err != nil {
		if err == chatservice.ErrUnauthorized {
			c.WriteJSON(outgoing{
				Event: unauthorizedEvent,
				Error: "you are not a participant of this chat",
			})
		} else {
			c.WriteJSON(outgoing{
				Event: errorEvent,
				Error: err.Error(),
			})
		}
		c.Close()
		return
	}
	defer store.Close()

	sub := store.Subscribe()
	defer sub.Close()

	go func() {
		for {
			event, err := sub.ReceiveEvent()
			if err != nil {
				return // Close the connection
			}
			switch event.Type {
			case chatservice.MessageEventMessage:
				if event.Message == nil || event.Message.SenderId == userId {
					continue
				}
				c.WriteJSON(outgoing{
					Messages: []models.Message{
						*event.Message,
					},
					Event: messageSent,
				})

			case chatservice.MessageEventTyping:
				if event.Data == nil {
					return
				}
				var typingData chatservice.TypingEvent
				err := json.Unmarshal(event.Data, &typingData)
				if err != nil {
					log.Printf("failed to unmarshal seen data: %v", err)
					return
				}
				if typingData.UserId == userId {
					continue
				}
				if typingData.IsTyping {
					c.WriteJSON(outgoing{
						Event: typingStarted,
					})
				} else {
					c.WriteJSON(outgoing{
						Event: typingStopped,
					})
				}

			case chatservice.MessageEventUpdate:
				if event.Message == nil || event.Message.SenderId == userId {
					return
				}
				if event.Message.CreatedAt != event.Message.UpdatedAt {
					c.WriteJSON(outgoing{
						Event: messageUpdated,
						Messages: []models.Message{
							*event.Message,
						},
					})
				} else {
					if event.Message.Received {
						c.WriteJSON(outgoing{
							Event: messageReceived,
							Messages: []models.Message{
								*event.Message,
							},
						})
					} else if event.Message.Seen {
						c.WriteJSON(outgoing{
							Event: messageSeen,
							Messages: []models.Message{
								*event.Message,
							},
						})
					}
				}

			case chatservice.MessageEventSeen:
				if event.Message == nil || event.Data == nil {
					return
				}

				seenData := make(map[string]any)
				if err := json.Unmarshal(event.Data, &seenData); err != nil {
					log.Printf("failed to unmarshal seen data: %v", err)
					return
				}

				idsAny, ok := seenData["message_ids"].([]any)
				if !ok {
					if sids, ok2 := seenData["message_ids"].([]string); ok2 {
						idsAny = make([]any, len(sids))
						for i, v := range sids {
							idsAny[i] = v
						}
					} else {
						log.Printf("failed to get message ids from seen data, got type %T", seenData["message_ids"])
						return
					}
				}

				mgsSeenPtr := make([]*models.Message, len(idsAny))
				var wg sync.WaitGroup
				for i, raw := range idsAny {
					mid, ok := raw.(string)
					if !ok {
						continue
					}

					wg.Add(1)
					go func(idx int, msgID string) {
						defer wg.Done()
						m, err := store.GetMessageById(msgID)
						if err != nil {
							log.Printf("failed to get message by id %s: %v", msgID, err)
							return
						}
						if m == nil {
							log.Printf("store.GetMessageById returned nil for id %s", msgID)
							return
						}
						mgsSeenPtr[idx] = m
					}(i, mid)
				}
				wg.Wait()

				var mgsSeen []models.Message
				mgsSeen = make([]models.Message, 0, len(mgsSeenPtr))
				for _, mp := range mgsSeenPtr {
					if mp != nil {
						mgsSeen = append(mgsSeen, *mp)
					}
				}

				if err := c.WriteJSON(outgoing{
					Event:    messageSeen,
					Messages: mgsSeen,
				}); err != nil {
					log.Printf("failed to write message seen JSON to client: %v", err)
				}
			}
		}
	}()

	for {
		_, msgBytes, err := c.ReadMessage()
		if err != nil {
			log.Printf("connection closed %s: %v", chatId, err)
			c.Close()
			return
		}
		if err := json.Unmarshal(msgBytes, &incoming); err != nil {
			c.WriteJSON(outgoing{
				Event: errorEvent,
				Error: err.Error(),
			})
			continue
		}

		switch incoming.Event {
		case messageSent:
			if incoming.Message == nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "message is required",
				})
				continue
			}
			userMgs := &models.Message{
				Id:        strings.ToUpper(utils.GenerateID(20)),
				SenderId:  userId,
				Content:   incoming.Message.Content,
				CreatedAt: incoming.Message.CreatedAt,
				UpdatedAt: incoming.Message.CreatedAt,
				Type:      incoming.Message.Type,
			}
			if len(incoming.Message.Media) > 0 {
				for _, media := range incoming.Message.Media {
					userMgs.Media = append(userMgs.Media, models.Media{
						Id:        strings.ToUpper(utils.GenerateID(20)),
						Type:      media.Type,
						Url:       media.Url,
						CreatedAt: media.CreatedAt,
					})
				}
			}
			if err := store.SendMessage(userMgs); err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
		case messageUpdated:
			if incoming.Message == nil || incoming.Message.Id == nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "message is required",
				})
				continue
			}
			userMgs := &models.Message{
				Id:        *incoming.Message.Id,
				SenderId:  userId,
				Content:   incoming.Message.Content,
				UpdatedAt: time.Now(),
			}
			if len(incoming.Message.Media) > 0 {
				for _, media := range incoming.Message.Media {
					userMgs.Media = append(userMgs.Media, models.Media{
						Id:        strings.ToUpper(utils.GenerateID(20)),
						Type:      media.Type,
						Url:       media.Url,
						CreatedAt: media.CreatedAt,
					})
				}
			}
			if _, err := store.UpdateMessage(*incoming.Message.Id, userMgs); err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
		case typingStarted:
			if err := store.SendTypingEvent(userId); err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
		case typingStopped:
			if err := store.StopTypingEvent(userId); err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
		case reactionAdded:
			if incoming.Reaction == nil || incoming.Reaction.MessageId == "" || incoming.Reaction.Reaction == "" {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "reaction is required",
				})
				continue
			}
			mgs, err := store.GetMessageById(incoming.Reaction.MessageId)
			if err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
				continue
			}
			reaction := models.Reaction{
				SenderId:  userId,
				CreatedAt: time.Now(),
				Content:   incoming.Message.Content,
				Id:        utils.GenerateID(10),
			}
			mgs.Reactions = append(mgs.Reactions, reaction)
			if _, err := store.UpdateMessage(mgs.Id, mgs); err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
		case reactionRemoved:
			if incoming.Reaction.MessageId == "" {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "message id is required",
				})
				continue
			}
			mgs, err := store.GetMessageById(incoming.Reaction.MessageId)
			if err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
				continue
			}
			for i, r := range mgs.Reactions {
				if r.SenderId == userId {
					mgs.Reactions = append(mgs.Reactions[:i], mgs.Reactions[i+1:]...)
					if _, err := store.UpdateMessage(mgs.Id, mgs); err != nil {
						c.WriteJSON(outgoing{
							Event: errorEvent,
							Error: err.Error(),
						})
					}
					continue
				}
			}
		case messageReceived:
			if incoming.Message == nil || incoming.Message.Id == nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "message id is required",
				})
			}
			mgs, err := store.GetMessageById(*incoming.Message.Id)
			if err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
			mgs.Received = true
			if _, err := store.UpdateMessage(mgs.Id, mgs); err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
		case messageSeen:
			if len(incoming.MarkSeen) == 0 {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "mark_seen array is required",
				})
			}
			if err := store.MarkMessagesSeen(incoming.MarkSeen, userId); err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
		case queryMessages:
			if incoming.MessageQuery == nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "message query is required",
				})
				continue
			}
			if incoming.MessageQuery.Limit == 0 {
				incoming.MessageQuery.Limit = 10
			}
			mgs, err := store.GetMessages(incoming.MessageQuery.Limit, incoming.MessageQuery.BeforeId)
			if err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
			c.WriteJSON(outgoing{
				Event:    messagesQuerySuccess,
				Messages: mgs,
			})
		}
	}
}
