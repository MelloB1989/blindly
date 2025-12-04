package models

import "time"

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
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

type Match struct {
	TableName        string           `karma_table:"matches" json:"-"`
	Id               int              `json:"id"`
	SheId            string           `json:"she_id"`
	HeId             string           `json:"he_id"`
	Score            int              `json:"score"`
	PostUnlockRating PostUnlockRating `json:"post_unlock_rating" db:"post_unlock_rating"`
	IsUnlocked       bool             `json:"is_unlocked"`
	MatchedAt        time.Time        `json:"matched_at"`
}

type Chat struct {
	TableName string    `karma_table:"chats" json:"-"`
	Id        int       `json:"id"`
	MatchId   string    `json:"match_id"`
	CreatedAt time.Time `json:"created_at"`
	Messages  []Message `json:"messages" db:"messages"`
}

type Post struct {
	TableName string    `karma_table:"posts" json:"-"`
	Id        int       `json:"id"`
	UserId    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Content   string    `json:"content"`
	Likes     int       `json:"likes"`
	Comments  int       `json:"comments"`
}

type Comment struct {
	TableName string    `karma_table:"comments" json:"-"`
	Id        int       `json:"id"`
	PostId    string    `json:"post_id"`
	ReplyToId string    `json:"reply_to_id"`
	UserId    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Content   string    `json:"content"`
}
