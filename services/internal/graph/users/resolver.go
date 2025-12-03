package users

import (
	"blindly/internal/graph/model"
	"blindly/internal/models"
	"context"
	"fmt"
)

type Resolver struct{}

func NewResolver() *Resolver {
	return &Resolver{}
}

func (r *Resolver) CreateUser(ctx context.Context, input model.CreateUserInput) (*model.AuthPayload, error) {
	panic(fmt.Errorf("not implemented: CreateUser - createUser"))
}

func (r *Resolver) LoginWithPassword(ctx context.Context, email string, password string) (*model.AuthPayload, error) {
	panic(fmt.Errorf("not implemented: LoginWithPassword - loginWithPassword"))
}

func (r *Resolver) RequestEmailLoginCode(ctx context.Context, email string) (bool, error) {
	panic(fmt.Errorf("not implemented: RequestEmailLoginCode - requestEmailLoginCode"))
}

func (r *Resolver) VerifyEmailLoginCode(ctx context.Context, email string, code string) (*model.AuthPayload, error) {
	panic(fmt.Errorf("not implemented: VerifyEmailLoginCode - verifyEmailLoginCode"))
}

func (r *Resolver) UpdateMe(ctx context.Context, input model.UpdateUserInput) (*models.User, error) {
	panic(fmt.Errorf("not implemented: UpdateMe - updateMe"))
}

func (r *Resolver) RefreshToken(ctx context.Context, refreshToken string) (*model.AuthPayload, error) {
	panic(fmt.Errorf("not implemented: RefreshToken - refreshToken"))
}

func (r *Resolver) Me(ctx context.Context) (*models.User, error) {
	panic(fmt.Errorf("not implemented: Me - me"))
}

func (r *Resolver) User(ctx context.Context, id string) (*models.User, error) {
	panic(fmt.Errorf("not implemented: User - user"))
}
