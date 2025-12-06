package users

import (
	"blindly/internal/graph/model"
	"blindly/internal/models"
	"fmt"
	"time"

	"github.com/MelloB1989/karma/config"
	"github.com/MelloB1989/karma/utils"
	"github.com/MelloB1989/karma/v2/orm"
)

func CreateUser(user models.User) (*models.User, error) {
	if user.Id == "" {
		user.Id = utils.GenerateID(7)
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	usersORM := orm.Load(&models.User{})
	defer usersORM.Close()

	if err := usersORM.Insert(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserById(id string) (*models.User, error) {
	usersORM := orm.Load(&models.User{},
		orm.WithCacheKey(fmt.Sprintf("user-%s", id)),
		orm.WithCacheOn(true),
		orm.WithInfiniteCacheTTL(),
		orm.WithCacheMethod(config.GetEnvRaw("CACHE_METHOD")),
	)
	defer usersORM.Close()

	var u []models.User
	if err := usersORM.GetByFieldEquals("Id", id).Scan(&u); err != nil {
		return nil, err
	}
	if len(u) == 0 {
		return nil, fmt.Errorf("user not found")
	}
	user := u[0]

	return &user, nil
}

func GetUserPublicById(id string) (*model.UserPublic, error) {
	user, err := GetUserById(id)
	if err != nil || user == nil {
		return nil, err
	}

	return ToUserPublic(*user), nil
}

func UpdateUser(user models.User) (*models.User, error) {
	usersORM := orm.Load(&models.User{})
	defer usersORM.Close()

	if err := usersORM.Update(&user, user.Id); err != nil {
		return nil, err
	}
	usersORM.InvalidateCacheByPrefix(fmt.Sprintf("user-%s", user.Id))

	return &user, nil
}

func GetUserActivities(userId string, activityType ...models.ActivityType) ([]models.UserProfileActivity, error) {
	activitiesORM := orm.Load(&models.UserProfileActivity{})
	defer activitiesORM.Close()

	var activities []models.UserProfileActivity
	if err := activitiesORM.GetByFieldEquals("UserId", userId).Scan(&activities); err != nil {
		return nil, err
	}

	if len(activityType) > 0 {
		filteredActivities := make([]models.UserProfileActivity, 0)
		for _, activity := range activities {
			for _, t := range activityType {
				if activity.Type == t {
					filteredActivities = append(filteredActivities, activity)
				}
			}
		}
		activities = filteredActivities
	}

	return activities, nil
}
