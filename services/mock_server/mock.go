package mockserver

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"sync"
	"time"
)

// --- Models ---

type User struct {
	ID                string         `json:"id"`
	FirstName         string         `json:"firstName"`
	LastName          string         `json:"lastName,omitempty"`
	Age               int            `json:"age"`
	Bio               string         `json:"bio"`
	Hobbies           []string       `json:"hobbies"`
	PersonalityTraits map[string]int `json:"personalityTraits"`
	Photos            []string       `json:"photos"`
	IsVerified        bool           `json:"isVerified"`
	IsRevealed        bool           `json:"isRevealed"`
	MatchScore        int            `json:"matchScore,omitempty"`
	Distance          string         `json:"distance,omitempty"`
}

type Message struct {
	ID            string `json:"id"`
	ChatID        string `json:"chatId"`
	Text          string `json:"text"`
	SenderID      string `json:"senderId"`
	Timestamp     string `json:"timestamp"`
	IsAISuggested bool   `json:"isAiSuggested"`
}

type Chat struct {
	ID               string    `json:"id"`
	MatchID          string    `json:"matchId"`
	UserID           string    `json:"userId"`
	LastMessage      string    `json:"lastMessage"`
	UnreadCount      int       `json:"unreadCount"`
	UpdatedAt        string    `json:"updatedAt"`
	MessagesCount    int       `json:"messagesCount"`
	MessagesRequired int       `json:"messagesRequired"`
	CanUnlock        bool      `json:"canUnlock"`
	Messages         []Message `json:"messages,omitempty"`
}

type Match struct {
	ID                string `json:"id"`
	ProfileID         string `json:"profileId"`
	MessagesCount     int    `json:"messagesCount"`
	MessagesRequired  int    `json:"messagesRequired"`
	IsUnlockRequested bool   `json:"isUnlockRequested"`
	IsUnlocked        bool   `json:"isUnlocked"`
	Rating            *int   `json:"rating,omitempty"`
	CreatedAt         string `json:"createdAt"`
}

type Post struct {
	ID         string   `json:"id"`
	User       PostUser `json:"user"`
	Content    string   `json:"content"`
	Timestamp  string   `json:"timestamp"`
	Likes      int      `json:"likes"`
	Comments   int      `json:"comments"`
	Reposts    int      `json:"reposts"`
	IsLiked    bool     `json:"isLiked"`
	IsReposted bool     `json:"isReposted"`
}

type PostUser struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Avatar     *string `json:"avatar,omitempty"`
	IsRevealed bool    `json:"isRevealed"`
}

type AIResponse struct {
	Suggestion string `json:"suggestion"`
}

type AIRecommendationsResponse struct {
	Reply           string `json:"reply"`
	Recommendations []User `json:"recommendations,omitempty"`
}

type SwipeRequest struct {
	ProfileID string `json:"profileId"`
	Action    string `json:"action"` // like, pass, superlike
}

type SwipeResponse struct {
	Matched bool   `json:"matched"`
	MatchID string `json:"matchId,omitempty"`
}

type RatingRequest struct {
	MatchID string `json:"matchId"`
	Rating  int    `json:"rating"`
}

type RatingResponse struct {
	Success   bool   `json:"success"`
	Continued bool   `json:"continued"`
	Message   string `json:"message"`
}

type UnlockRequest struct {
	MatchID string `json:"matchId"`
}

type UnlockResponse struct {
	Requested bool   `json:"requested,omitempty"`
	Unlocked  bool   `json:"unlocked,omitempty"`
	Message   string `json:"message"`
}

type PokeRequest struct {
	UserID string `json:"userId"`
}

type SendMessageRequest struct {
	Text string `json:"text"`
}

type CreatePostRequest struct {
	Content string `json:"content"`
}

type CommentRequest struct {
	Content string `json:"content"`
}

type AIBioRequest struct {
	Hobbies []string `json:"hobbies"`
	Traits  []string `json:"traits"`
}

type AIChatRequest struct {
	Message             string          `json:"message"`
	ConversationHistory []AIConvMessage `json:"conversationHistory"`
}

type AIConvMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// --- Mock Data ---

var mockUsers = []User{
	{
		ID:        "u1",
		FirstName: "Alex",
		Age:       26,
		Bio:       "I love getting lost in new cities and finding the best local coffee spots. Looking for someone who enjoys quiet weekends as much as spontaneous trips.",
		Hobbies:   []string{"Photography", "Travel", "Reading", "Coffee"},
		PersonalityTraits: map[string]int{
			"Creative":    5,
			"Introvert":   4,
			"Chill":       5,
			"Adventurous": 3,
		},
		Photos: []string{
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330",
			"https://images.unsplash.com/photo-1517841905240-472988babdf9",
		},
		IsVerified: true,
		IsRevealed: false,
		MatchScore: 85,
		Distance:   "2 miles away",
	},
	{
		ID:        "u2",
		FirstName: "Jordan",
		Age:       29,
		Bio:       "Tech enthusiast by day, gamer by night. I'm really into sci-fi novels and building mechanical keyboards. Let's debate whether tabs or spaces are better.",
		Hobbies:   []string{"Gaming", "Tech", "Music", "Reading"},
		PersonalityTraits: map[string]int{
			"Analytical": 5,
			"Introvert":  4,
			"Ambitious":  4,
		},
		Photos: []string{
			"https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
		},
		IsVerified: true,
		IsRevealed: true,
		MatchScore: 92,
		Distance:   "5 miles away",
	},
	{
		ID:        "u3",
		FirstName: "Taylor",
		Age:       24,
		Bio:       "Always chasing the next mountain peak. If I'm not hiking, I'm probably painting or trying a new recipe. Life's too short for boring food!",
		Hobbies:   []string{"Hiking", "Art", "Cooking", "Yoga"},
		PersonalityTraits: map[string]int{
			"Adventurous": 5,
			"Extrovert":   4,
			"Creative":    5,
		},
		Photos: []string{
			"https://images.unsplash.com/photo-1534528741775-53994a69daeb",
		},
		IsVerified: false,
		IsRevealed: false,
		MatchScore: 78,
		Distance:   "12 miles away",
	},
	{
		ID:        "u4",
		FirstName: "Morgan",
		Age:       27,
		Bio:       "Coffee connoisseur and amateur chef. I believe every meal should be an adventure. Currently perfecting my homemade pasta recipe.",
		Hobbies:   []string{"Cooking", "Coffee", "Travel", "Photography"},
		PersonalityTraits: map[string]int{
			"Chill":    5,
			"Creative": 4,
			"Curious":  5,
		},
		Photos: []string{
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
		},
		IsVerified: true,
		IsRevealed: false,
		MatchScore: 88,
		Distance:   "3 miles away",
	},
	{
		ID:        "u5",
		FirstName: "Riley",
		Age:       25,
		Bio:       "Bookworm who occasionally touches grass. I've read over 100 books this year (yes, I keep count). Always down for a deep conversation about anything.",
		Hobbies:   []string{"Reading", "Writing", "Coffee", "Yoga"},
		PersonalityTraits: map[string]int{
			"Introvert":  5,
			"Empathetic": 5,
			"Curious":    4,
		},
		Photos: []string{
			"https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
		},
		IsVerified: true,
		IsRevealed: false,
		MatchScore: 91,
		Distance:   "1 mile away",
	},
	{
		ID:        "u6",
		FirstName: "Casey",
		Age:       28,
		Bio:       "Fitness enthusiast and dog parent. My golden retriever Max is the real star here. Looking for someone who doesn't mind getting up early for hikes.",
		Hobbies:   []string{"Fitness", "Hiking", "Pets", "Cooking"},
		PersonalityTraits: map[string]int{
			"Adventurous": 5,
			"Extrovert":   4,
			"Loyal":       5,
		},
		Photos: []string{
			"https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
		},
		IsVerified: true,
		IsRevealed: false,
		MatchScore: 82,
		Distance:   "7 miles away",
	},
	{
		ID:        "u7",
		FirstName: "Sam",
		Age:       31,
		Bio:       "Artist and dreamer. I spend my weekends at art galleries or creating my own pieces. Looking for someone who appreciates creativity in all forms.",
		Hobbies:   []string{"Art", "Music", "Photography", "Travel"},
		PersonalityTraits: map[string]int{
			"Creative":    5,
			"Spontaneous": 4,
			"Empathetic":  4,
		},
		Photos: []string{
			"https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
		},
		IsVerified: false,
		IsRevealed: false,
		MatchScore: 76,
		Distance:   "4 miles away",
	},
	{
		ID:        "u8",
		FirstName: "Avery",
		Age:       26,
		Bio:       "Software engineer who doesn't want to talk about code on dates. Let's talk about our favorite movies, travel dreams, or why pineapple absolutely belongs on pizza.",
		Hobbies:   []string{"Tech", "Movies", "Gaming", "Travel"},
		PersonalityTraits: map[string]int{
			"Analytical": 5,
			"Chill":      4,
			"Curious":    4,
		},
		Photos: []string{
			"https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
		},
		IsVerified: true,
		IsRevealed: false,
		MatchScore: 89,
		Distance:   "6 miles away",
	},
}

var currentUser = User{
	ID:        "me",
	FirstName: "Jamie",
	LastName:  "Doe",
	Age:       27,
	Bio:       "Just a simple human looking for connection.",
	Hobbies:   []string{"Music", "Coding"},
	PersonalityTraits: map[string]int{
		"Chill": 5,
	},
	IsVerified: true,
	IsRevealed: true,
}

var mockMatches = []Match{
	{
		ID:                "m1",
		ProfileID:         "u2",
		MessagesCount:     15,
		MessagesRequired:  20,
		IsUnlockRequested: false,
		IsUnlocked:        false,
		CreatedAt:         "2024-01-15T10:00:00Z",
	},
	{
		ID:                "m2",
		ProfileID:         "u1",
		MessagesCount:     8,
		MessagesRequired:  20,
		IsUnlockRequested: false,
		IsUnlocked:        false,
		CreatedAt:         "2024-01-14T15:30:00Z",
	},
	{
		ID:                "m3",
		ProfileID:         "u5",
		MessagesCount:     22,
		MessagesRequired:  20,
		IsUnlockRequested: true,
		IsUnlocked:        false,
		CreatedAt:         "2024-01-13T09:15:00Z",
	},
}

var mockChats = []Chat{
	{
		ID:               "c1",
		MatchID:          "m1",
		UserID:           "u2",
		LastMessage:      "That sounds awesome! Have you ever built one from scratch?",
		UnreadCount:      2,
		UpdatedAt:        "10:30 AM",
		MessagesCount:    15,
		MessagesRequired: 20,
		CanUnlock:        false,
		Messages: []Message{
			{ID: "m1", ChatID: "c1", Text: "Hey! I saw you're into mechanical keyboards too.", SenderID: "me", Timestamp: "10:00 AM", IsAISuggested: false},
			{ID: "m2", ChatID: "c1", Text: "Yeah! I just finished my first build. It's a 65% layout.", SenderID: "u2", Timestamp: "10:05 AM", IsAISuggested: false},
			{ID: "m3", ChatID: "c1", Text: "That sounds awesome! Have you ever built one from scratch?", SenderID: "me", Timestamp: "10:30 AM", IsAISuggested: true},
		},
	},
	{
		ID:               "c2",
		MatchID:          "m2",
		UserID:           "u1",
		LastMessage:      "I'd love to see your photography sometime.",
		UnreadCount:      0,
		UpdatedAt:        "Yesterday",
		MessagesCount:    8,
		MessagesRequired: 20,
		CanUnlock:        false,
		Messages: []Message{
			{ID: "m1", ChatID: "c2", Text: "Hi Alex, your bio really resonated with me.", SenderID: "me", Timestamp: "Yesterday", IsAISuggested: false},
			{ID: "m2", ChatID: "c2", Text: "Thank you! I noticed you're into photography too?", SenderID: "u1", Timestamp: "Yesterday", IsAISuggested: false},
			{ID: "m3", ChatID: "c2", Text: "I'd love to see your photography sometime.", SenderID: "me", Timestamp: "Yesterday", IsAISuggested: false},
		},
	},
	{
		ID:               "c3",
		MatchID:          "m3",
		UserID:           "u5",
		LastMessage:      "What's your favorite book this year?",
		UnreadCount:      1,
		UpdatedAt:        "2h ago",
		MessagesCount:    22,
		MessagesRequired: 20,
		CanUnlock:        true,
		Messages: []Message{
			{ID: "m1", ChatID: "c3", Text: "A fellow bookworm! What genres do you usually read?", SenderID: "me", Timestamp: "3h ago", IsAISuggested: false},
			{ID: "m2", ChatID: "c3", Text: "Mostly literary fiction and some sci-fi. I just finished Project Hail Mary and loved it!", SenderID: "u5", Timestamp: "2h ago", IsAISuggested: false},
			{ID: "m3", ChatID: "c3", Text: "What's your favorite book this year?", SenderID: "u5", Timestamp: "2h ago", IsAISuggested: false},
		},
	},
}

var mockPosts = []Post{
	{
		ID:         "p1",
		User:       PostUser{ID: "u2", Name: "Jordan", Avatar: strPtr("https://images.unsplash.com/photo-1500648767791-00dcc994a43e"), IsRevealed: true},
		Content:    "Just finished building my new mechanical keyboard! The thock is real. ⌨️🔊 Anyone else into custom builds?",
		Timestamp:  "2h ago",
		Likes:      24,
		Comments:   5,
		Reposts:    2,
		IsLiked:    false,
		IsReposted: false,
	},
	{
		ID:         "p2",
		User:       PostUser{ID: "u3", Name: "Taylor", Avatar: nil, IsRevealed: false},
		Content:    "Hiking up Mount Tamalpais this weekend. The forecast looks perfect! ☀️🏔️ Anyone want to join?",
		Timestamp:  "4h ago",
		Likes:      12,
		Comments:   8,
		Reposts:    0,
		IsLiked:    true,
		IsReposted: false,
	},
	{
		ID:         "p3",
		User:       PostUser{ID: "u1", Name: "Alex", Avatar: nil, IsRevealed: false},
		Content:    "Unpopular opinion: Pineapple belongs on pizza. Fight me. 🍍🍕",
		Timestamp:  "6h ago",
		Likes:      48,
		Comments:   32,
		Reposts:    5,
		IsLiked:    false,
		IsReposted: false,
	},
	{
		ID:         "p4",
		User:       PostUser{ID: "u4", Name: "Morgan", Avatar: nil, IsRevealed: false},
		Content:    "Finally nailed my homemade pasta recipe! 🍝 The secret is letting the dough rest for at least 30 minutes. Who wants the full recipe?",
		Timestamp:  "8h ago",
		Likes:      67,
		Comments:   23,
		Reposts:    12,
		IsLiked:    true,
		IsReposted: false,
	},
	{
		ID:         "p5",
		User:       PostUser{ID: "u5", Name: "Riley", Avatar: nil, IsRevealed: false},
		Content:    "Just finished reading 'Tomorrow, and Tomorrow, and Tomorrow' and I'm emotionally destroyed in the best way. 📚😭 Any book recommendations to fill this void?",
		Timestamp:  "12h ago",
		Likes:      89,
		Comments:   41,
		Reposts:    8,
		IsLiked:    false,
		IsReposted: false,
	},
}

var (
	swipeHistory = make(map[string]string) // profileID -> action
	mu           sync.RWMutex
)

// AI response pools
var bioSuggestions = []string{
	"Coffee lover ☕ | Weekend explorer 🌍 | Always looking for the next great book 📚",
	"Tech geek by day, aspiring chef by night. Let's swap recipes and sci-fi recommendations.",
	"Nature enthusiast who loves hiking and photography. Looking for a partner in crime for my next adventure.",
	"Introvert with extrovert energy when I'm comfortable. Let's skip the small talk and have real conversations.",
	"Creative soul who believes in the power of good coffee and great music. What's on your playlist?",
	"Amateur chef, professional food critic (of my own cooking). Looking for someone to share meals and laughs with.",
	"Book nerd, movie buff, and occasional gym-goer. My ideal date involves cozy cafes and deep conversations.",
	"Adventure seeker with a soft spot for lazy Sunday mornings. Balance is key, right?",
}

var rizzSuggestions = []string{
	"That sounds amazing! Tell me more about it.",
	"I've never tried that, but I'd love to learn.",
	"Haha, that's hilarious! 😂",
	"What's your favorite thing about it?",
	"I can totally relate to that!",
	"That's such a cool perspective. What made you think of that?",
	"I'd love to hear more about your experience with that.",
	"That reminds me of something similar that happened to me...",
	"You seem really passionate about this. I love that energy!",
	"What got you interested in that in the first place?",
}

var aiCompanionResponses = []string{
	"Based on what you've told me, I think you'd really click with someone who values deep conversations and quiet moments. Let me find some profiles that match that vibe!",
	"I noticed you mentioned loving travel! There are a few people nearby who share that passion. Want me to show you their profiles?",
	"It sounds like you're looking for someone genuine. Let me pull up some profiles of people whose bios feel authentic and thoughtful.",
	"From our conversation, I get the sense you value creativity. Here are some artistic souls who might catch your interest!",
	"You seem like someone who appreciates a good sense of humor. Let me find you some people who love to laugh!",
}

// --- Handlers ---

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func strPtr(s string) *string {
	return &s
}

// User endpoints
func handleMe(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(currentUser)
}

func handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "PUT" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var updates User
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Apply updates
	if updates.Bio != "" {
		currentUser.Bio = updates.Bio
	}
	if updates.Hobbies != nil {
		currentUser.Hobbies = updates.Hobbies
	}
	if updates.PersonalityTraits != nil {
		currentUser.PersonalityTraits = updates.PersonalityTraits
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(currentUser)
}

// Feed/Discovery endpoints
func handleFeed(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	w.Header().Set("Content-Type", "application/json")

	// Filter out already swiped profiles
	mu.RLock()
	availableUsers := make([]User, 0)
	for _, user := range mockUsers {
		if _, swiped := swipeHistory[user.ID]; !swiped {
			availableUsers = append(availableUsers, user)
		}
	}
	mu.RUnlock()

	json.NewEncoder(w).Encode(availableUsers)
}

func handleSwipe(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SwipeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	mu.Lock()
	swipeHistory[req.ProfileID] = req.Action
	mu.Unlock()

	response := SwipeResponse{Matched: false}

	// Simulate matching on like/superlike (30% chance)
	if (req.Action == "like" || req.Action == "superlike") && rand.Float32() < 0.3 {
		response.Matched = true
		response.MatchID = fmt.Sprintf("m%d", time.Now().UnixNano())

		// Add to matches
		newMatch := Match{
			ID:                response.MatchID,
			ProfileID:         req.ProfileID,
			MessagesCount:     0,
			MessagesRequired:  20,
			IsUnlockRequested: false,
			IsUnlocked:        false,
			CreatedAt:         time.Now().Format(time.RFC3339),
		}
		mockMatches = append(mockMatches, newMatch)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handlePoke(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PokeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Match endpoints
func handleMatches(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mockMatches)
}

func handleRateMatch(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RatingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	continued := req.Rating >= 7
	message := "Connection ended. Better luck next time!"
	if continued {
		message = "Great! You both want to continue. Keep chatting!"
	}

	response := RatingResponse{
		Success:   true,
		Continued: continued,
		Message:   message,
	}

	// Update match rating
	for i, m := range mockMatches {
		if m.ID == req.MatchID {
			mockMatches[i].Rating = &req.Rating
			break
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleRequestUnlock(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req UnlockRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Update match
	for i, m := range mockMatches {
		if m.ID == req.MatchID {
			mockMatches[i].IsUnlockRequested = true
			break
		}
	}

	response := UnlockResponse{
		Requested: true,
		Message:   "Unlock request sent! You'll be notified when they respond.",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleRespondUnlock(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		MatchID string `json:"matchId"`
		Accept  bool   `json:"accept"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := UnlockResponse{
		Unlocked: body.Accept,
		Message:  "Unlock declined.",
	}

	if body.Accept {
		response.Message = "Photos unlocked! You can now see each other."
		for i, m := range mockMatches {
			if m.ID == body.MatchID {
				mockMatches[i].IsUnlocked = true
				break
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Chat endpoints
func handleChats(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	w.Header().Set("Content-Type", "application/json")

	// Return chats without full message history
	chatsWithoutMessages := make([]Chat, len(mockChats))
	for i, chat := range mockChats {
		chatsWithoutMessages[i] = chat
		chatsWithoutMessages[i].Messages = nil
	}

	json.NewEncoder(w).Encode(chatsWithoutMessages)
}

func handleChatMessages(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	// Extract chat ID from URL
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	chatID := parts[3]

	// Find chat
	var chat *Chat
	for _, c := range mockChats {
		if c.ID == chatID {
			chat = &c
			break
		}
	}

	if chat == nil {
		http.Error(w, "Chat not found", http.StatusNotFound)
		return
	}

	if r.Method == "GET" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(chat.Messages)
		return
	}

	if r.Method == "POST" {
		var req SendMessageRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		newMessage := Message{
			ID:            fmt.Sprintf("m%d", time.Now().UnixNano()),
			ChatID:        chatID,
			Text:          req.Text,
			SenderID:      "me",
			Timestamp:     time.Now().Format("3:04 PM"),
			IsAISuggested: false,
		}

		// Add message to chat
		for i, c := range mockChats {
			if c.ID == chatID {
				mockChats[i].Messages = append(mockChats[i].Messages, newMessage)
				mockChats[i].LastMessage = req.Text
				mockChats[i].MessagesCount++
				mockChats[i].CanUnlock = mockChats[i].MessagesCount >= mockChats[i].MessagesRequired
				break
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(newMessage)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

// Social/Posts endpoints
func handlePosts(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}

	if r.Method == "GET" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockPosts)
		return
	}

	if r.Method == "POST" {
		var req CreatePostRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		newPost := Post{
			ID:         fmt.Sprintf("p%d", time.Now().UnixNano()),
			User:       PostUser{ID: "me", Name: currentUser.FirstName, Avatar: nil, IsRevealed: false},
			Content:    req.Content,
			Timestamp:  "Just now",
			Likes:      0,
			Comments:   0,
			Reposts:    0,
			IsLiked:    false,
			IsReposted: false,
		}

		mockPosts = append([]Post{newPost}, mockPosts...)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(newPost)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func handlePostLike(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract post ID from URL
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID := parts[3]

	liked := false
	for i, post := range mockPosts {
		if post.ID == postID {
			mockPosts[i].IsLiked = !mockPosts[i].IsLiked
			if mockPosts[i].IsLiked {
				mockPosts[i].Likes++
			} else {
				mockPosts[i].Likes--
			}
			liked = mockPosts[i].IsLiked
			break
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"liked": liked})
}

func handlePostComment(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Extract post ID from URL
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID := parts[3]

	// Increment comment count
	for i, post := range mockPosts {
		if post.ID == postID {
			mockPosts[i].Comments++
			break
		}
	}

	comment := map[string]interface{}{
		"id":        fmt.Sprintf("comment%d", time.Now().UnixNano()),
		"postId":    postID,
		"content":   req.Content,
		"timestamp": "Just now",
		"user": map[string]interface{}{
			"id":         "me",
			"name":       currentUser.FirstName,
			"isRevealed": false,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comment)
}

func handlePostRepost(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract post ID from URL
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	postID := parts[3]

	var reposted bool
	for i, post := range mockPosts {
		if post.ID == postID {
			mockPosts[i].IsReposted = !mockPosts[i].IsReposted
			if mockPosts[i].IsReposted {
				mockPosts[i].Reposts++
			} else {
				mockPosts[i].Reposts--
			}
			reposted = mockPosts[i].IsReposted
			break
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"reposted": reposted})
}

// AI endpoints
func handleAIBio(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	w.Header().Set("Content-Type", "application/json")

	// Simulate AI processing delay
	time.Sleep(800 * time.Millisecond)

	resp := AIResponse{
		Suggestion: bioSuggestions[rand.Intn(len(bioSuggestions))],
	}
	json.NewEncoder(w).Encode(resp)
}

func handleAISuggestReply(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	w.Header().Set("Content-Type", "application/json")

	time.Sleep(500 * time.Millisecond)

	resp := AIResponse{
		Suggestion: rizzSuggestions[rand.Intn(len(rizzSuggestions))],
	}
	json.NewEncoder(w).Encode(resp)
}

func handleAIRecommendations(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	time.Sleep(1 * time.Second)

	// Return a random subset of users as recommendations
	shuffled := make([]User, len(mockUsers))
	copy(shuffled, mockUsers)
	rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})

	recommendations := shuffled[:min(3, len(shuffled))]
	json.NewEncoder(w).Encode(recommendations)
}

func handleAIChat(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == "OPTIONS" {
		return
	}
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")

	var req AIChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	time.Sleep(1200 * time.Millisecond)

	// Random AI companion response
	reply := aiCompanionResponses[rand.Intn(len(aiCompanionResponses))]

	// Sometimes include recommendations
	var recommendations []User
	if rand.Float32() < 0.4 {
		shuffled := make([]User, len(mockUsers))
		copy(shuffled, mockUsers)
		rand.Shuffle(len(shuffled), func(i, j int) {
			shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
		})
		recommendations = shuffled[:min(2, len(shuffled))]
	}

	response := AIRecommendationsResponse{
		Reply:           reply,
		Recommendations: recommendations,
	}
	json.NewEncoder(w).Encode(response)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func StartMockServer(ctx context.Context) error {
	rand.Seed(time.Now().UnixNano())

	// User endpoints
	http.HandleFunc("/api/users/me", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" || r.Method == "OPTIONS" {
			handleMe(w, r)
		} else if r.Method == "PUT" {
			handleUpdateProfile(w, r)
		}
	})

	// Feed/Discovery endpoints
	http.HandleFunc("/api/feed", handleFeed)
	http.HandleFunc("/api/swipe", handleSwipe)
	http.HandleFunc("/api/poke", handlePoke)

	// Match endpoints
	http.HandleFunc("/api/matches", handleMatches)
	http.HandleFunc("/api/matches/rate", handleRateMatch)
	http.HandleFunc("/api/matches/unlock", handleRequestUnlock)
	http.HandleFunc("/api/matches/unlock/respond", handleRespondUnlock)

	// Chat endpoints
	http.HandleFunc("/api/chats", handleChats)
	http.HandleFunc("/api/chats/", handleChatMessages)

	// Social/Posts endpoints
	http.HandleFunc("/api/posts", handlePosts)
	http.HandleFunc("/api/posts/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.HasSuffix(path, "/like") {
			handlePostLike(w, r)
		} else if strings.HasSuffix(path, "/comments") {
			handlePostComment(w, r)
		} else if strings.HasSuffix(path, "/repost") {
			handlePostRepost(w, r)
		}
	})

	// AI endpoints
	http.HandleFunc("/api/ai/generate-bio", handleAIBio)
	http.HandleFunc("/api/ai/suggest-reply", handleAISuggestReply)
	http.HandleFunc("/api/ai/recommendations", handleAIRecommendations)
	http.HandleFunc("/api/ai/chat", handleAIChat)

	// fmt.Println("🚀 Blindly Mock API server running on :8080")
	// fmt.Println("")
	// fmt.Println("Available endpoints:")
	// fmt.Println("  GET    /api/users/me           - Get current user")
	// fmt.Println("  PUT    /api/users/me           - Update profile")
	// fmt.Println("  GET    /api/feed               - Get discovery feed")
	// fmt.Println("  POST   /api/swipe              - Swipe on a profile")
	// fmt.Println("  POST   /api/poke               - Poke a user")
	// fmt.Println("  GET    /api/matches            - Get all matches")
	// fmt.Println("  POST   /api/matches/rate       - Rate a match")
	// fmt.Println("  POST   /api/matches/unlock     - Request photo unlock")
	// fmt.Println("  GET    /api/chats              - Get all chats")
	// fmt.Println("  GET    /api/chats/:id/messages - Get chat messages")
	// fmt.Println("  POST   /api/chats/:id/messages - Send a message")
	// fmt.Println("  GET    /api/posts              - Get social feed")
	// fmt.Println("  POST   /api/posts              - Create a post")
	// fmt.Println("  POST   /api/posts/:id/like     - Like/unlike a post")
	// fmt.Println("  POST   /api/posts/:id/comments - Comment on a post")
	// fmt.Println("  POST   /api/posts/:id/repost   - Repost a post")
	// fmt.Println("  POST   /api/ai/generate-bio    - Generate AI bio")
	// fmt.Println("  POST   /api/ai/suggest-reply   - Get AI reply suggestion")
	// fmt.Println("  POST   /api/ai/recommendations - Get AI recommendations")
	// fmt.Println("  POST   /api/ai/chat            - Chat with AI companion")
	// fmt.Println("")

	server := &http.Server{Addr: ":8081"}

	go func() {
		<-ctx.Done()
		log.Println("Mock server shutting down...")
		server.Shutdown(context.Background())
	}()

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}
