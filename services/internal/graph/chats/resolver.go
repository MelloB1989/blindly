package chats

import (
	"blindly/internal/anal"
	"blindly/internal/graph/directives"
	"blindly/internal/graph/model"
	"blindly/internal/models"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	"github.com/MelloB1989/karma/v2/orm"
)

type Resolver struct {
}

func NewResolver() *Resolver {
	return &Resolver{}
}

type connRow struct {
	ChatJSON           json.RawMessage `json:"chat"`
	MatchJSON          json.RawMessage `json:"match"`
	LastMessage        sql.NullString  `json:"last_message"`
	UnreadMessages     sql.NullInt64   `json:"unread_messages"`
	PercentageComplete sql.NullFloat64 `json:"percentage_complete"`
	ProfileJSON        json.RawMessage `json:"connection_profile"`
}

func (r *Resolver) GetMyConnections(ctx context.Context) ([]*model.Connection, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	connORM := orm.Load(&models.Chat{})
	defer connORM.Close()

	query := `
SELECT
  row_to_json(c) AS chat,
  row_to_json(m) AS match,
  CASE
    WHEN c.messages IS NULL OR jsonb_array_length(c.messages::jsonb) = 0 THEN NULL
    ELSE (c.messages::jsonb -> (jsonb_array_length(c.messages::jsonb) - 1)) ->> 'body'
  END AS last_message,
  (
    SELECT COUNT(*)::bigint
    FROM jsonb_array_elements(c.messages::jsonb) elem
    WHERE NOT ( (elem->'read_by') ? $1 )
  ) AS unread_messages,
  (
    LEAST(
      (COALESCE(jsonb_array_length(c.messages::jsonb), 0)::float / 500.0) * 100.0,
      100.0
    )
  ) AS percentage_complete,
  row_to_json(u) AS connection_profile
FROM matches m
LEFT JOIN chats c ON c.match_id = m.id::text
JOIN users u ON u.id = CASE WHEN m.she_id = $1 THEN m.he_id ELSE m.she_id END
WHERE m.she_id = $1 OR m.he_id = $1
ORDER BY m.matched_at DESC;
`

	qr := connORM.QueryRaw(query, claims.UserID)
	var rows []connRow
	if err := qr.Scan(&rows); err != nil {
		return nil, fmt.Errorf("query scan error: %w", err)
	}

	conns := make([]*model.Connection, 0, len(rows))
	for _, rrow := range rows {
		var chat models.Chat
		if len(rrow.ChatJSON) > 0 {
			if err := json.Unmarshal(rrow.ChatJSON, &chat); err != nil {
				log.Printf("unmarshal chat json error: %v", err)
				return nil, fmt.Errorf("unmarshal chat json error: %w", err)
			}
		}

		var match models.Match
		if len(rrow.MatchJSON) > 0 {
			if err := json.Unmarshal(rrow.MatchJSON, &match); err != nil {
				log.Printf("unmarshal match json error: %v", err)
				return nil, fmt.Errorf("unmarshal match json error: %w", err)
			}
		}

		var profile model.UserPublic
		if len(rrow.ProfileJSON) > 0 {
			if err := json.Unmarshal(rrow.ProfileJSON, &profile); err != nil {
				log.Printf("unmarshal profile json error: %v", err)
				return nil, fmt.Errorf("unmarshal profile json error: %w", err)
			}
		}

		lastMsg := ""
		if rrow.LastMessage.Valid {
			lastMsg = rrow.LastMessage.String
		}

		var unread int32 = 0
		if rrow.UnreadMessages.Valid {
			unread = int32(rrow.UnreadMessages.Int64)
		}

		var pct float64 = 0
		if rrow.PercentageComplete.Valid {
			pct = rrow.PercentageComplete.Float64
		}

		conn := &model.Connection{
			Chat:               nil,
			Match:              nil,
			LastMessage:        lastMsg,
			UnreadMessages:     unread,
			PercentageComplete: pct,
			ConnectionProfile:  nil,
		}
		if chat.Id != "" {
			conn.Chat = &chat
		}
		if match.Id != "" {
			conn.Match = &match
		}
		conn.ConnectionProfile = &profile

		conns = append(conns, conn)
	}

	return conns, nil
}
