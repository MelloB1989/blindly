package graph

import "blindly/internal/graph/users"

type Resolver struct {
	UserResolver *users.Resolver
}

func NewResolver() *Resolver {
	return &Resolver{
		UserResolver: users.NewResolver(),
	}
}
