package chats

import (
	"blindly/internal/anal"
	"blindly/internal/graph/directives"
	"blindly/internal/graph/model"
	"blindly/internal/graph/shared"
	"blindly/internal/models"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	"github.com/MelloB1989/karma/database"
)

type Resolver struct {
}

func NewResolver() *Resolver {
	return &Resolver{}
}

type connRow struct {
	ChatJSON           json.RawMessage
	MatchJSON          json.RawMessage
	LastMessage        sql.NullString
	UnreadMessages     sql.NullInt64
	PercentageComplete sql.NullFloat64
	ProfileJSON        json.RawMessage
}

func (r *Resolver) GetMyConnections(ctx context.Context) ([]*model.Connection, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	db, err := database.PostgresConn()
	if err != nil {
		log.Printf("[ERROR] Failed to connect to database: %v", err)
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

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

	dbRows, err := db.Query(query, claims.UserID)
	if err != nil {
		log.Printf("[ERROR] Query error: %v", err)
		return nil, fmt.Errorf("query error: %w", err)
	}
	defer dbRows.Close()

	var rows []connRow
	for dbRows.Next() {
		var row connRow
		if err := dbRows.Scan(&row.ChatJSON, &row.MatchJSON, &row.LastMessage, &row.UnreadMessages, &row.PercentageComplete, &row.ProfileJSON); err != nil {
			log.Printf("[ERROR] Row scan error: %v", err)
			return nil, fmt.Errorf("row scan error: %w", err)
		}
		rows = append(rows, row)
	}
	if err := dbRows.Err(); err != nil {
		log.Printf("[ERROR] Rows iteration error: %v", err)
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	conns := make([]*model.Connection, 0, len(rows))
	for _, rrow := range rows {
		var chat models.Chat
		if len(rrow.ChatJSON) > 0 {
			var dbChat shared.DBChat
			if err := json.Unmarshal(rrow.ChatJSON, &dbChat); err != nil {
				log.Printf("unmarshal chat json error: %v", err)
				return nil, fmt.Errorf("unmarshal chat json error: %w", err)
			}
			chat = dbChat.ToChat()
		}

		var match models.Match
		if len(rrow.MatchJSON) > 0 {
			var dbMatch shared.DBMatch
			if err := json.Unmarshal(rrow.MatchJSON, &dbMatch); err != nil {
				log.Printf("unmarshal match json error: %v", err)
				return nil, fmt.Errorf("unmarshal match json error: %w", err)
			}
			match = dbMatch.ToMatch()
		}

		var profile *model.UserPublic
		if len(rrow.ProfileJSON) > 0 {
			var dbProfile shared.DBUserProfile
			if err := json.Unmarshal(rrow.ProfileJSON, &dbProfile); err != nil {
				log.Printf("unmarshal profile json error: %v", err)
				return nil, fmt.Errorf("unmarshal profile json error: %w", err)
			}
			profile = dbProfile.ToUserPublic()
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
			ConnectionProfile:  profile,
		}
		if chat.Id != "" {
			conn.Chat = &chat
		}
		if match.Id != "" {
			conn.Match = &match
		}

		conns = append(conns, conn)
	}

	return conns, nil
}
