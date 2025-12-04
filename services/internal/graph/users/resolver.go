package users

import (
	"blindly/internal/anal"
	"blindly/internal/auth"
	"blindly/internal/auth/workos"
	"blindly/internal/graph/directives"
	"blindly/internal/graph/model"
	"blindly/internal/helpers/users"
	"blindly/internal/models"
	"context"
	"errors"
	"fmt"

	"github.com/MelloB1989/karma/config"
)

type Resolver struct{}

func NewResolver() *Resolver {
	return &Resolver{}
}

func (r *Resolver) CreateUser(ctx context.Context, input model.CreateUserInput) (*model.AuthPayload, error) {
	switch config.GetEnvRaw("BLINDLY_AUTH_SERVICE") {
	case "workos":
		return workos.NewWorkosAuth().CreateUser(input)
	default:
		return nil, fmt.Errorf("invalid auth service")
	}
}

func (r *Resolver) LoginWithPassword(ctx context.Context, email string, password string) (*model.AuthPayload, error) {
	switch config.GetEnvRaw("BLINDLY_AUTH_SERVICE") {
	case "workos":
		return workos.NewWorkosAuth().LoginWithPassword(email, password)
	default:
		return nil, fmt.Errorf("invalid auth service")
	}
}

func (r *Resolver) RequestEmailLoginCode(ctx context.Context, email string) (bool, error) {
	switch config.GetEnvRaw("BLINDLY_AUTH_SERVICE") {
	case "workos":
		return workos.NewWorkosAuth().RequestEmailLoginCode(email)
	default:
		return false, fmt.Errorf("invalid auth service")
	}
}

func (r *Resolver) VerifyEmailLoginCode(ctx context.Context, email string, code string) (*model.AuthPayload, error) {
	switch config.GetEnvRaw("BLINDLY_AUTH_SERVICE") {
	case "workos":
		return workos.NewWorkosAuth().VerifyEmailLoginCode(email, code)
	default:
		return nil, fmt.Errorf("invalid auth service")
	}
}

func (r *Resolver) UpdateMe(ctx context.Context, input model.UpdateUserInput) (*models.User, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	user, err := users.GetUserById(claims.UserID)
	if err != nil {
		return nil, err
	}

	if input.FirstName != nil {
		user.FirstName = *input.FirstName
	}
	if input.LastName != nil {
		user.LastName = *input.LastName
	}
	if input.Dob != nil {
		user.Dob = *input.Dob
	}
	if input.Bio != nil {
		user.Bio = *input.Bio
	}
	if input.Pfp != nil {
		user.Pfp = *input.Pfp
	}
	if input.Address != nil {
		user.Address.City = input.Address.City
		user.Address.State = input.Address.State
		user.Address.Country = input.Address.Country
	}
	if len(input.Interests) > 0 {
		user.Interests = input.Interests
	}
	if len(input.Hobbies) > 0 {
		user.Hobbies = input.Hobbies
	}
	if len(input.UserPrompts) > 0 {
		user.UserPrompts = input.UserPrompts
	}
	if len(input.Photos) > 0 {
		user.Photos = input.Photos
	}
	if len(input.PersonalityTraits) > 0 {
		pt := make(map[string]int)
		for _, trait := range input.PersonalityTraits {
			if trait != nil {
				pt[trait.Key] = int(trait.Value)
			}
		}
		user.PersonalityTraits = pt
	}

	return users.UpdateUser(*user)
}

func (r *Resolver) RefreshToken(ctx context.Context) (*model.AuthPayload, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	fu, err := users.GetUserById(claims.UserID)
	if err != nil || fu == nil {
		if err != nil {
			return nil, err
		}
		return nil, errors.New("user not found")
	}

	t, err := auth.CreateJWT(*fu)
	if err != nil {
		return nil, err
	}

	ap := &model.AuthPayload{
		AccessToken: t,
		User:        fu,
	}

	return ap, nil
}

func (r *Resolver) Me(ctx context.Context) (*models.User, error) {
	claims, ae, err := directives.GetAuthClaims(ctx)
	if err != nil {
		ae.SendRequestError(anal.UNAUTHORIZED_401, err)
		return nil, fmt.Errorf("unauthorized: %w", err)
	}

	fu, err := users.GetUserById(claims.UserID)
	if err != nil || fu == nil {
		if err != nil {
			return nil, err
		}
		return nil, errors.New("user not found")
	}

	return fu, nil
}
