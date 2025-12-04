package chat

import (
	chatservice "blindly/internal/chat_service"
	"blindly/internal/models"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func FlushHandler(c *fiber.Ctx) error {
	signature := c.Get("Upstash-Signature")
	if signature == "" {
		return fiber.ErrUnauthorized
	}

	if !chatservice.VerifyQStashSignature(signature, c.Body()) {
		nextKey := config.GetEnvRaw("QSTASH_NEXT_SIGNING_KEY")
		if nextKey != "" {
			mac := hmac.New(sha256.New, []byte(nextKey))
			mac.Write(c.Body())
			expectedSig := base64.StdEncoding.EncodeToString(mac.Sum(nil))
			if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
				return fiber.ErrBadRequest
			}
		} else {
			return fiber.ErrBadRequest
		}
	}

	req := new(chatservice.FlushRequest)
	if err := c.BodyParser(req); err != nil {
		return fiber.ErrBadRequest
	}

	if req.ChatId == "" {
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

var incoming struct {
	Message      *models.Message `json:"message"`
	Reaction     *reaction       `json:"reaction"`
	Event        events          `json:"event"`
	MarkSeen     []string        `json:"mark_seen"`
	MessageQuery *messageQuery   `json:"message_query"`
}

type outgoing struct {
	Messages []models.Message `json:"message"`
	Data     any              `json:"data"`
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
				break
			}
			eventJSON, _ := json.Marshal(event)
			c.WriteJSON(eventJSON)
		}
	}()

	for {
		_, msgBytes, err := c.ReadMessage()
		if err != nil {
			log.Printf("failed to read message from chat %s: %v", chatId, err)
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
			if err := store.SendMessage(incoming.Message); err != nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: err.Error(),
				})
			}
		case messageUpdated:
			if incoming.Message == nil {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "message is required",
				})
				continue
			}
			if _, err := store.UpdateMessage(incoming.Message.Id, incoming.Message); err != nil {
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
			if incoming.Message == nil || incoming.Message.Id == "" {
				c.WriteJSON(outgoing{
					Event: errorEvent,
					Error: "message id is required",
				})
			}
			mgs, err := store.GetMessageById(incoming.Message.Id)
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
