package models

import (
	"time"

	"github.com/golang-jwt/jwt"
)

type Address struct {
	City        string    `json:"city"`
	State       string    `json:"state"`
	Country     string    `json:"country"`
	Coordinates []float64 `json:"coordinates" db:"coordinates"` // latitude, longitude
}

type PostUnlockRating struct {
	SheRating int `json:"she_rating"`
	HeRating  int `json:"he_rating"`
}

type Media struct {
	Id        int       `json:"id"`
	Type      string    `json:"type"`
	Url       string    `json:"url"`
	CreatedAt time.Time `json:"created_at"`
}

type Reaction struct {
	Id        int       `json:"id"`
	SenderId  string    `json:"sender_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Message struct {
	Id        int        `json:"id"`
	Content   string     `json:"content"`
	SenderId  string     `json:"sender_id"`
	Media     []Media    `json:"media" db:"media"`
	Reactions []Reaction `json:"reactions" db:"reactions"`
	CreatedAt time.Time  `json:"created_at"`
}

type Claims struct {
	UserID      string `json:"uid"`
	Email       string `json:"email"`
	Gender      string `json:"gender"`
	DateOfBirth string `json:"date_of_birth"`
	Name        string `json:"name"`
	Pfp         string `json:"pfp"`
	jwt.StandardClaims
}
