package chatservice

import (
	"blindly/internal/models"
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
	"github.com/redis/go-redis/v9"
)

type FlushRequest struct {
	ChatId     string `json:"chatId"`
	FlushToken string `json:"flushToken"`
}

func (s *Store) insertMessagesToDB(messages []models.Message) error {
	chatORM := orm.Load(&models.Chat{})
	defer chatORM.Close()

	var chats []models.Chat
	if err := chatORM.GetByFieldEquals("Id", s.chatId).Scan(&chats); err != nil {
		return fmt.Errorf("failed to get chat: %w", err)
	}

	if len(chats) == 0 {
		return fmt.Errorf("chat not found: %s", s.chatId)
	}

	chat := chats[0]

	existingIds := make(map[string]bool)
	for _, msg := range chat.Messages {
		existingIds[msg.Id] = true
	}

	for _, msg := range messages {
		if existingIds[msg.Id] {
			continue
		}
		chat.Messages = append(chat.Messages, msg)
	}

	updateORM := orm.Load(&models.Chat{})
	defer updateORM.Close()

	if err := updateORM.Update(&chat, s.chatId); err != nil {
		return fmt.Errorf("failed to update chat: %w", err)
	}

	s.rc.Del(ctx, chatCacheKey(s.chatId))

	return nil
}

func (s *Store) updateMessageInDB(messageId string, updates *models.Message) (*models.Message, error) {
	chatORM := orm.Load(&models.Chat{})
	defer chatORM.Close()

	var chats []models.Chat
	if err := chatORM.GetByFieldEquals("Id", s.chatId).Scan(&chats); err != nil {
		return nil, fmt.Errorf("failed to get chat: %w", err)
	}

	if len(chats) == 0 {
		return nil, fmt.Errorf("chat not found: %s", s.chatId)
	}

	chat := chats[0]
	var updatedMsg *models.Message

	for i, msg := range chat.Messages {
		if msg.Id == messageId {
			if updates.Content != "" {
				chat.Messages[i].Content = updates.Content
			}
			if updates.Type != "" {
				chat.Messages[i].Type = updates.Type
			}
			chat.Messages[i].Received = updates.Received
			chat.Messages[i].Seen = updates.Seen
			if updates.Media != nil {
				chat.Messages[i].Media = updates.Media
			}
			if updates.Reactions != nil {
				chat.Messages[i].Reactions = updates.Reactions
			}
			updatedMsg = &chat.Messages[i]
			break
		}
	}

	if updatedMsg == nil {
		return nil, fmt.Errorf("message not found: %s", messageId)
	}

	updateORM := orm.Load(&models.Chat{})
	defer updateORM.Close()

	if err := updateORM.Update(&chat, s.chatId); err != nil {
		return nil, fmt.Errorf("failed to update chat: %w", err)
	}

	s.rc.Del(ctx, chatCacheKey(s.chatId))

	return updatedMsg, nil
}

func (s *Store) updateMessageInBuffer(messageId string, updates *models.Message) (*models.Message, error) {
	msgsKey := chatMsgsKey(s.chatId)

	// Lua script to find and update message atomically
	luaScript := redis.NewScript(`
		local messages = redis.call('LRANGE', KEYS[1], 0, -1)
		for i, msgJson in ipairs(messages) do
			local msg = cjson.decode(msgJson)
			if msg.id == ARGV[1] then
				-- Update fields from the updates JSON
				local updates = cjson.decode(ARGV[2])
				for k, v in pairs(updates) do
					if v ~= nil and k ~= 'id' and k ~= 'created_at' then
						msg[k] = v
					end
				end
				local updated = cjson.encode(msg)
				redis.call('LSET', KEYS[1], i - 1, updated)
				return updated
			end
		end
		return nil
	`)

	updatesJSON, _ := json.Marshal(updates)
	result, err := luaScript.Run(ctx, s.rc, []string{msgsKey}, messageId, string(updatesJSON)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Not found in buffer
		}
		return nil, err
	}

	if result == nil {
		return nil, nil // Not found in buffer
	}

	var msg models.Message
	if str, ok := result.(string); ok {
		if err := json.Unmarshal([]byte(str), &msg); err != nil {
			return nil, err
		}
	}

	return &msg, nil
}

func (s *Store) getBufferedMessages() ([]models.Message, error) {
	msgsKey := chatMsgsKey(s.chatId)
	msgStrings, err := s.rc.LRange(ctx, msgsKey, 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get buffered messages: %w", err)
	}

	messages := make([]models.Message, 0, len(msgStrings))
	for _, msgStr := range msgStrings {
		var msg models.Message
		if err := json.Unmarshal([]byte(msgStr), &msg); err != nil {
			log.Printf("failed to unmarshal buffered message: %v", err)
			continue
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

func (s *Store) pushMessagesBack(messages []models.Message) error {
	if len(messages) == 0 {
		return nil
	}

	msgsKey := chatMsgsKey(s.chatId)
	pipe := s.rc.Pipeline()

	for i := len(messages) - 1; i >= 0; i-- {
		msgJSON, err := json.Marshal(messages[i])
		if err != nil {
			continue
		}
		pipe.LPush(ctx, msgsKey, msgJSON)
	}

	_, err := pipe.Exec(ctx)
	return err
}

func VerifyQStashSignature(signature string, body []byte) bool {
	signingKey := config.GetEnvRaw("QSTASH_CURRENT_SIGNING_KEY")
	if signingKey == "" {
		log.Println("QSTASH_CURRENT_SIGNING_KEY not set")
		return false
	}

	mac := hmac.New(sha256.New, []byte(signingKey))
	mac.Write(body)
	expectedSig := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expectedSig))
}

func (s *Store) scheduleFlush() error {
	s.ensureRedis()

	msgsKey := chatMsgsKey(s.chatId)
	length, err := s.rc.LLen(ctx, msgsKey).Result()
	if err != nil {
		return fmt.Errorf("failed to get buffer length: %w", err)
	}

	tokenKey := chatFlushTokenKey(s.chatId)
	token, err := s.rc.Get(ctx, tokenKey).Result()
	if err == redis.Nil || token == "" {
		token = utils.GenerateID()
		s.rc.Set(ctx, tokenKey, token, IdleTimeout+10*time.Second)
	} else if err != nil {
		return fmt.Errorf("failed to get flush token: %w", err)
	}

	bearer := config.GetEnvRaw("QSTASH_TOKEN")

	if length >= BatchSize {
		return publishQStashFlush(bearer, s.chatId, 0, token)
	}

	return publishQStashFlush(bearer, s.chatId, IdleTimeout, token)
}

func publishQStashFlush(bearer string, chatId string, delay time.Duration, token string) error {
	baseURL := config.GetEnvRaw("QSTASH_URL")
	backendURL := config.GetEnvRaw("BACKEND_URL")
	url := fmt.Sprintf("%s/v2/publish/%s/v1/chat/flush", baseURL, backendURL)

	payload := FlushRequest{
		ChatId:     chatId,
		FlushToken: token,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal flush request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+bearer)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Upstash-Deduplication-Id", fmt.Sprintf("chat--%s--flush--%s", chatId, token))

	if delay > 0 {
		req.Header.Set("Upstash-Delay", fmt.Sprintf("%ds", int(delay.Seconds())))
	}

	req.Header.Set("Upstash-Retries", "3")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("qstash request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("qstash publish failed %d: %s", resp.StatusCode, string(b))
	}

	return nil
}
