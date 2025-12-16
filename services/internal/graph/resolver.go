package graph

import (
	blockedusers "blindly/internal/graph/blocked_users"
	"blindly/internal/graph/chats"
	"blindly/internal/graph/community"
	profileactivities "blindly/internal/graph/profile_activities"
	"blindly/internal/graph/reports"
	"blindly/internal/graph/swipes"
	"blindly/internal/graph/users"
	"blindly/internal/graph/verifications"
)

type Resolver struct {
	UserResolver            *users.Resolver
	ProfileActivityResolver *profileactivities.Resolver
	ChatsResolver           *chats.Resolver
	SwipesResolver          *swipes.Resolver
	CommunityResolver       *community.Resolver
	ReportResolver          *reports.Resolver
	VerificationResolver    *verifications.Resolver
	BlockedUsersResolver    *blockedusers.Resolver
}

func NewResolver() *Resolver {
	return &Resolver{
		UserResolver:            users.NewResolver(),
		ProfileActivityResolver: profileactivities.NewResolver(),
		ChatsResolver:           chats.NewResolver(),
		SwipesResolver:          swipes.NewResolver(),
		CommunityResolver:       community.NewResolver(),
		ReportResolver:          reports.NewResolver(),
		VerificationResolver:    verifications.NewResolver(),
		BlockedUsersResolver:    blockedusers.NewResolver(),
	}
}
