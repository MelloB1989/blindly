package models

import (
	"time"
)

type User struct {
	TableName         string         `karma_table:"users" json:"-"`
	Id                string         `json:"id" karma:"primary"`
	FirstName         string         `json:"first_name"`
	LastName          string         `json:"last_name"`
	Email             string         `json:"email"`
	Dob               time.Time      `json:"dob"`
	Pfp               string         `json:"pfp"`
	Bio               string         `json:"bio"`
	Gender            string         `json:"gender"`
	Hobbies           []string       `json:"hobbies" db:"hobbies"`
	Interests         []string       `json:"interests" db:"interests"`
	UserPrompts       []string       `json:"user_prompts" db:"user_prompts"`
	PersonalityTraits map[string]int `json:"personality_traits" db:"personality_traits"` // 1-5
	Photos            []string       `json:"photos" db:"photos"`
	IsVerified        bool           `json:"is_verified"`
	Address           Address        `json:"address" db:"address"`
	Extra             ExtraMetadata  `json:"extra"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

type Match struct {
	TableName        string           `karma_table:"matches" json:"-"`
	Id               string           `json:"id" karma:"primary"`
	SheId            string           `json:"she_id"`
	HeId             string           `json:"he_id"`
	Score            int              `json:"score"`
	PostUnlockRating PostUnlockRating `json:"post_unlock_rating" db:"post_unlock_rating"`
	IsUnlocked       bool             `json:"is_unlocked"`
	MatchedAt        time.Time        `json:"matched_at"`
}

type Chat struct {
	TableName string    `karma_table:"chats" json:"-"`
	Id        string    `json:"id" karma:"primary"`
	MatchId   string    `json:"match_id"`
	CreatedAt time.Time `json:"created_at"`
	Messages  []Message `json:"messages" db:"messages"`
}

type Post struct {
	TableName string    `karma_table:"posts" json:"-"`
	Id        string    `json:"id" karma:"primary"`
	UserId    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Content   string    `json:"content"`
	Media     []Media   `json:"media" db:"media"`
	Likes     int       `json:"likes"`
	IsLiked   bool      `json:"is_liked" karma:"ignore"` // Not stored in DB
	Comments  int       `json:"comments"`
	Views     int       `json:"views"`
}

type Comment struct {
	TableName string    `karma_table:"comments" json:"-"`
	Id        string    `json:"id" karma:"primary"`
	PostId    string    `json:"post_id"`
	ReplyToId string    `json:"reply_to_id"`
	UserId    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Content   string    `json:"content"`
	Likes     int       `json:"likes"`
	IsLiked   bool      `json:"is_liked" karma:"ignore"` // Not stored in DB
}

type UserFiles struct {
	TableName  struct{}  `karma_table:"user_files"`
	Id         string    `json:"id" karma:"primary"`
	Uid        string    `json:"uid"`
	Key        string    `json:"key"`
	S3Path     string    `json:"s3_path"`
	Visibility string    `json:"visibility"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type UserProfileActivity struct {
	TableName string       `karma_table:"user_profile_activities" json:"-"`
	Id        string       `json:"id" karma:"primary"`
	UserId    string       `json:"user_id"`
	Type      ActivityType `json:"type"`
	TargetId  string       `json:"target_id"`
	CreatedAt time.Time    `json:"created_at"`
}

type Swipe struct {
	TableName  string    `karma_table:"swipes" json:"-"`
	Id         string    `json:"id" karma:"primary"`
	UserId     string    `json:"user_id"`
	TargetId   string    `json:"target_id"`
	ActionType SwipeType `json:"action_type"` // "like", "superlike", "dislike"
	CreatedAt  time.Time `json:"created_at"`
}
