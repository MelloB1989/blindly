package models

type ActivityType string

const (
	POKE         ActivityType = "POKE"
	PROFILE_VIEW ActivityType = "PROFILE_VIEW"
	SUPERLIKE    ActivityType = "SUPERLIKE"
)

type SwipeType string

const (
	LIKE       SwipeType = "LIKE"
	SUPERRLIKE SwipeType = "SUPERLIKE"
	DISLIKE    SwipeType = "DISLIKE"
)

type MessageType string

const (
	TEXT  MessageType = "TEXT"
	IMAGE MessageType = "IMAGE"
	VIDEO MessageType = "VIDEO"
	AUDIO MessageType = "AUDIO"
	FILE  MessageType = "FILE"
)
