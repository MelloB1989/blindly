package profileactivities

import (
	"blindly/internal/anal"
	"blindly/internal/graph/directives"
	"blindly/internal/graph/model"
	"blindly/internal/models"
	"context"
	"fmt"
	"time"

	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

type Resolver struct {
}

func NewResolver() *Resolver {
	return &Resolver{}
}

func (r *Resolver) CreateProfileActivity(ctx context.Context, typeArg models.ActivityType, targetUserID string) (*models.UserProfileActivity, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	profileActivity := &models.UserProfileActivity{
		UserId:    claims.UserID,
		Id:        utils.GenerateID(10),
		Type:      models.ActivityType(typeArg),
		TargetId:  targetUserID,
		CreatedAt: time.Now(),
	}

	activityORM := orm.Load(&models.UserProfileActivity{})
	defer activityORM.Close()

	var ac []models.UserProfileActivity
	if err := activityORM.GetByFieldsEquals(map[string]any{
		"UserId":   claims.UserID,
		"TargetId": targetUserID,
		"Type":     typeArg,
	}).Scan(&ac); err != nil {
		ae.SendRequestError(anal.SERVER_ERROR_500, err)
		return nil, fmt.Errorf("failed to get user profile activities: %w", err)
	}
	if len(ac) > 0 {
		return nil, fmt.Errorf("activity already exists")
	}

	if err := activityORM.Insert(profileActivity); err != nil {
		ae.SendRequestError(anal.SERVER_ERROR_500, err)
		return nil, fmt.Errorf("failed to create profile activity: %w", err)
	}

	return profileActivity, nil
}

func (r *Resolver) ProfileActivities(ctx context.Context, class *model.ActivityClass) ([]*models.UserProfileActivity, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	activityORM := orm.Load(&models.UserProfileActivity{})
	defer activityORM.Close()

	query := `
SELECT *
FROM user_profile_activities
WHERE user_id = $1 OR target_id = $1
ORDER BY created_at DESC
`
	qr := activityORM.QueryRaw(query, claims.UserID)

	var all []*models.UserProfileActivity
	if err := qr.Scan(&all); err != nil {
		ae.SendRequestError(anal.SERVER_ERROR_500, err)
		return nil, fmt.Errorf("failed to fetch profile activities: %w", err)
	}

	if class == nil {
		if all == nil {
			return []*models.UserProfileActivity{}, nil
		}
		return all, nil
	}

	var filtered []*models.UserProfileActivity
	switch *class {
	case model.ActivityClassReceived:
		for _, a := range all {
			if a.TargetId == claims.UserID {
				filtered = append(filtered, a)
			}
		}
	case model.ActivityClassSent:
		for _, a := range all {
			if a.UserId == claims.UserID {
				filtered = append(filtered, a)
			}
		}
	default:
		return []*models.UserProfileActivity{}, nil
	}

	if filtered == nil {
		return []*models.UserProfileActivity{}, nil
	}
	return filtered, nil
}
