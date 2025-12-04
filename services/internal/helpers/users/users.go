package users

import (
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

func UpdateUser(user models.User) (*models.User, error) {
	usersORM := orm.Load(&models.User{})

	if err := usersORM.Update(&user, user.Id); err != nil {
		return nil, err
	}
	usersORM.InvalidateCacheByPrefix(fmt.Sprintf("user-%s", user.Id))

	return &user, nil
}
