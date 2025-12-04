package graph

import (
	"blindly/internal/graph/chats"
	profileactivities "blindly/internal/graph/profile_activities"
	"blindly/internal/graph/swipes"
	"blindly/internal/graph/users"
)

type Resolver struct {
	UserResolver            *users.Resolver
	ProfileActivityResolver *profileactivities.Resolver
	ChatsResolver           *chats.Resolver
	SwipesResolver          *swipes.Resolver
}

func NewResolver() *Resolver {
	return &Resolver{
		UserResolver:            users.NewResolver(),
		ProfileActivityResolver: profileactivities.NewResolver(),
		ChatsResolver:           chats.NewResolver(),
		SwipesResolver:          swipes.NewResolver(),
	}
}
