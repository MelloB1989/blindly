package swipes

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
	"time"

	"github.com/MelloB1989/karma/database"
	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

type Resolver struct {
}

func NewResolver() *Resolver {
	return &Resolver{}
}

type swipedProfileRow struct {
	SwipeJSON   json.RawMessage `json:"swipe" db:"swipe"`
	ProfileJSON json.RawMessage `json:"profile" db:"profile"`
}

type recommendedProfileRow struct {
	ProfileJSON        json.RawMessage
	MatchScore         float64
	CompatibilityScore float64
	CommonInterests    json.RawMessage
	DistanceKm         sql.NullFloat64
}

func (r *Resolver) Swipe(ctx context.Context, targetID string, actionType models.SwipeType) (*model.SwipeResponse, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	if claims.UserID == targetID {
		return nil, fmt.Errorf("cannot swipe on yourself")
	}

	go func() {
		activity := &models.UserProfileActivity{
			UserId:   claims.UserID,
			TargetId: targetID,
			Type:     models.PROFILE_VIEW,
		}
		activity.CreateActivity()
		if actionType == models.SUPERRLIKE {
			activity := &models.UserProfileActivity{
				UserId:   claims.UserID,
				TargetId: targetID,
				Type:     models.SUPERLIKE,
			}
			activity.CreateActivity()
		}
	}()

	swipeORM := orm.Load(&models.Swipe{})
	defer swipeORM.Close()

	var existingSwipes []models.Swipe
	err = swipeORM.GetByFieldsEquals(map[string]any{
		"UserId":   claims.UserID,
		"TargetId": targetID,
	}).Scan(&existingSwipes)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing swipe: %w", err)
	}
	if len(existingSwipes) > 0 {
		return nil, fmt.Errorf("you have already swiped on this user")
	}

	swipe := &models.Swipe{
		Id:         utils.GenerateID(10),
		UserId:     claims.UserID,
		TargetId:   targetID,
		ActionType: actionType,
		CreatedAt:  time.Now(),
	}

	err = swipeORM.Insert(swipe)
	if err != nil {
		return nil, fmt.Errorf("failed to create swipe: %w", err)
	}

	response := &model.SwipeResponse{
		Swipe: swipe,
		Match: nil,
	}

	if actionType == models.LIKE || actionType == models.SUPERRLIKE {
		db, dbErr := database.PostgresConn()
		if dbErr != nil {
			log.Printf("[ERROR] Failed to connect to database for mutual check: %v", dbErr)
			return response, nil
		}
		defer db.Close()

		var count int
		countErr := db.QueryRow(`
			SELECT COUNT(*) FROM swipes
			WHERE user_id = $1 AND target_id = $2
			AND (action_type = 'LIKE' OR action_type = 'SUPERLIKE')
		`, targetID, claims.UserID).Scan(&count)

		if countErr != nil {
			log.Printf("[ERROR] Failed to check mutual swipe: %v", countErr)
			return response, nil
		}

		log.Printf("[DEBUG] Mutual swipe check: targetID=%s swiped on userID=%s, count=%d", targetID, claims.UserID, count)

		if count > 0 {
			match, matchErr := r.createMatchAndChat(claims.UserID, targetID)
			if matchErr != nil {
				log.Printf("[ERROR] Failed to create match: %v", matchErr)
				return response, nil
			}
			response.Match = match
			log.Printf("[DEBUG] Match created: %+v", match)
		}
	}

	return response, nil
}

func (r *Resolver) createMatchAndChat(userID1, userID2 string) (*models.Match, error) {
	log.Printf("[DEBUG] createMatchAndChat called with userID1=%s, userID2=%s", userID1, userID2)

	db, err := database.PostgresConn()
	if err != nil {
		log.Printf("[ERROR] Failed to connect to database: %v", err)
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	var existingMatchID string
	err = db.QueryRow(`
		SELECT id FROM matches
		WHERE (she_id = $1 AND he_id = $2) OR (she_id = $2 AND he_id = $1)
		LIMIT 1
	`, userID1, userID2).Scan(&existingMatchID)

	if err == nil && existingMatchID != "" {
		log.Printf("[DEBUG] Match already exists with ID: %s", existingMatchID)
		var match models.Match
		match.Id = existingMatchID
		return &match, nil
	}

	matchID := utils.GenerateID(10)
	now := time.Now()
	_, err = db.Exec(`
		INSERT INTO matches (id, she_id, he_id, score, is_unlocked, matched_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, matchID, userID1, userID2, 50, false, now)

	if err != nil {
		log.Printf("[ERROR] Failed to insert match: %v", err)
		return nil, fmt.Errorf("failed to create match: %w", err)
	}

	log.Printf("[DEBUG] Match created with ID: %s", matchID)

	match := &models.Match{
		Id:         matchID,
		SheId:      userID1,
		HeId:       userID2,
		Score:      50,
		IsUnlocked: false,
		MatchedAt:  now,
	}

	chatID := utils.GenerateID(10)
	_, err = db.Exec(`
		INSERT INTO chats (id, match_id, created_at, messages)
		VALUES ($1, $2, $3, $4)
	`, chatID, matchID, now, "[]")

	if err != nil {
		log.Printf("[ERROR] Failed to insert chat: %v", err)
		return match, nil
	}

	log.Printf("[DEBUG] Chat created with ID: %s for match ID: %s", chatID, matchID)

	return match, nil
}

func (r *Resolver) Recommendations(ctx context.Context, cursor *string, limit *int32) (*model.RecommendationsResult, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	queryLimit := int32(20)
	if limit != nil && *limit > 0 && *limit <= 50 {
		queryLimit = *limit
	}

	offset := 0
	if cursor != nil && *cursor != "" {
		fmt.Sscanf(*cursor, "%d", &offset)
	}

	db, err := database.PostgresConn()
	if err != nil {
		log.Printf("[ERROR] Failed to connect to database: %v", err)
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	query := `
SELECT
	row_to_json(u) AS profile,
	(RANDOM() * 100)::float AS match_score,
	(RANDOM() * 100)::float AS compatibility_score,
	'[]'::json AS common_interests,
	NULL::float AS distance_km
FROM users u
WHERE u.id != $1
  AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.user_id = $1 AND s.target_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m.she_id = $1 AND m.he_id = u.id) OR (m.she_id = u.id AND m.he_id = $1))
ORDER BY u.created_at DESC
LIMIT $2 OFFSET $3
`

	log.Printf("[DEBUG] Recommendations query for user: %s, limit: %d, offset: %d", claims.UserID, queryLimit+1, offset)

	rows, err := db.Query(query, claims.UserID, queryLimit+1, offset)
	if err != nil {
		log.Printf("[ERROR] Query error: %v", err)
		return nil, fmt.Errorf("failed to fetch recommendations: %w", err)
	}
	defer rows.Close()

	var resultRows []recommendedProfileRow
	for rows.Next() {
		var row recommendedProfileRow
		if err := rows.Scan(&row.ProfileJSON, &row.MatchScore, &row.CompatibilityScore, &row.CommonInterests, &row.DistanceKm); err != nil {
			log.Printf("[ERROR] Row scan error: %v", err)
			return nil, fmt.Errorf("failed to scan recommendation row: %w", err)
		}
		resultRows = append(resultRows, row)
	}
	if err := rows.Err(); err != nil {
		log.Printf("[ERROR] Rows iteration error: %v", err)
		return nil, fmt.Errorf("failed to iterate recommendations: %w", err)
	}

	log.Printf("[DEBUG] Rows returned: %d", len(resultRows))

	hasMore := len(resultRows) > int(queryLimit)
	if hasMore {
		resultRows = resultRows[:queryLimit]
	}

	items := make([]*model.RecommendedProfile, 0, len(resultRows))
	for _, row := range resultRows {
		var dbProfile shared.DBUserProfile
		if len(row.ProfileJSON) > 0 {
			if err := json.Unmarshal(row.ProfileJSON, &dbProfile); err != nil {
				log.Printf("[ERROR] Failed to unmarshal profile: %v", err)
				continue
			}
		}

		profile := dbProfile.ToUserPublic()

		commonInterests := make([]string, 0)
		if len(row.CommonInterests) > 0 {
			if err := json.Unmarshal(row.CommonInterests, &commonInterests); err != nil {
				log.Printf("[WARN] Failed to unmarshal common_interests: %v", err)
			}
		}

		rec := &model.RecommendedProfile{
			Profile:            profile,
			MatchScore:         row.MatchScore,
			CompatibilityScore: row.CompatibilityScore,
			CommonInterests:    commonInterests,
		}

		if row.DistanceKm.Valid {
			dist := row.DistanceKm.Float64
			rec.DistanceKm = &dist
		}

		items = append(items, rec)
	}

	var nextCursor *string
	if hasMore {
		next := fmt.Sprintf("%d", offset+int(queryLimit))
		nextCursor = &next
	}

	log.Printf("[DEBUG] Returning %d recommendations", len(items))

	return &model.RecommendationsResult{
		Items:      items,
		NextCursor: nextCursor,
		HasMore:    hasMore,
		FetchedAt:  time.Now(),
	}, nil
}

func (r *Resolver) MySwipes(ctx context.Context) ([]*model.SwipedProfile, error) {
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
	row_to_json(s) AS swipe,
	row_to_json(u) AS profile
FROM swipes s
JOIN users u ON u.id = s.target_id
WHERE s.user_id = $1
ORDER BY s.created_at DESC
`

	dbRows, err := db.Query(query, claims.UserID)
	if err != nil {
		log.Printf("[ERROR] Query error: %v", err)
		return nil, fmt.Errorf("failed to fetch swipes: %w", err)
	}
	defer dbRows.Close()

	var rows []swipedProfileRow
	for dbRows.Next() {
		var row swipedProfileRow
		if err := dbRows.Scan(&row.SwipeJSON, &row.ProfileJSON); err != nil {
			log.Printf("[ERROR] Row scan error: %v", err)
			return nil, fmt.Errorf("failed to scan swipe row: %w", err)
		}
		rows = append(rows, row)
	}
	if err := dbRows.Err(); err != nil {
		log.Printf("[ERROR] Rows iteration error: %v", err)
		return nil, fmt.Errorf("failed to iterate swipes: %w", err)
	}

	result := make([]*model.SwipedProfile, 0, len(rows))
	for _, row := range rows {
		var swipe models.Swipe
		if len(row.SwipeJSON) > 0 {
			if err := json.Unmarshal(row.SwipeJSON, &swipe); err != nil {
				continue
			}
		}

		var dbProfile shared.DBUserProfile
		if len(row.ProfileJSON) > 0 {
			if err := json.Unmarshal(row.ProfileJSON, &dbProfile); err != nil {
				continue
			}
		}

		profile := dbProfile.ToUserPublic()

		result = append(result, &model.SwipedProfile{
			Swipe:   &swipe,
			Profile: profile,
		})
	}

	return result, nil
}
