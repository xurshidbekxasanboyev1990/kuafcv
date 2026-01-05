package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins (configure for production)
	},
}

// Client represents a WebSocket client
type Client struct {
	ID       string
	UserID   string
	Role     string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *Hub
	mu       sync.Mutex
	lastPing time.Time
}

// Hub maintains active clients and broadcasts messages
type Hub struct {
	Clients    map[string]*Client // userID -> Client
	Broadcast  chan *Message
	Register   chan *Client
	Unregister chan *Client
	mu         sync.RWMutex
}

// Message represents a WebSocket message
type Message struct {
	Type      string      `json:"type"`
	UserID    string      `json:"user_id,omitempty"`
	Data      interface{} `json:"data"`
	Timestamp time.Time   `json:"timestamp"`
}

// NotificationMessage for real-time notifications
type NotificationMessage struct {
	ID        int       `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Link      string    `json:"link,omitempty"`
	Metadata  string    `json:"metadata,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// Global hub instance
var WSHub *Hub

// NewHub creates a new Hub
func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[string]*Client),
		Broadcast:  make(chan *Message, 256),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

// Run starts the hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			// Close existing connection if any
			if existing, ok := h.Clients[client.UserID]; ok {
				// Only close if it's a different client instance
				if existing != client {
					existing.Conn.Close()
					// Don't close Send channel here - let the old goroutine handle it
				}
			}
			h.Clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("WebSocket: Client connected - UserID: %s", client.UserID)

		case client := <-h.Unregister:
			h.mu.Lock()
			// Only unregister if this is still the current client for this user
			if existing, ok := h.Clients[client.UserID]; ok && existing == client {
				delete(h.Clients, client.UserID)
				close(client.Send)
				log.Printf("WebSocket: Client disconnected - UserID: %s", client.UserID)
			}
			h.mu.Unlock()

		case message := <-h.Broadcast:
			h.mu.RLock()
			// Send to specific user
			if message.UserID != "" {
				if client, ok := h.Clients[message.UserID]; ok {
					select {
					case client.Send <- encodeMessage(message):
					default:
						// Channel full or closed, skip
					}
				}
			} else {
				// Broadcast to all
				for _, client := range h.Clients {
					select {
					case client.Send <- encodeMessage(message):
					default:
						// Channel full or closed, skip
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func encodeMessage(msg *Message) []byte {
	data, _ := json.Marshal(msg)
	return data
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID string, msgType string, data interface{}) {
	h.Broadcast <- &Message{
		Type:      msgType,
		UserID:    userID,
		Data:      data,
		Timestamp: time.Now(),
	}
}

// BroadcastToRole sends a message to all users with a specific role
func (h *Hub) BroadcastToRole(role string, msgType string, data interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	msg := &Message{
		Type:      msgType,
		Data:      data,
		Timestamp: time.Now(),
	}
	msgBytes := encodeMessage(msg)

	for _, client := range h.Clients {
		if client.Role == role {
			select {
			case client.Send <- msgBytes:
			default:
				// Channel full or closed, skip this client
				// Don't close or delete here - let the unregister handle it
			}
		}
	}
}

// HandleWebSocket handles WebSocket connections
func HandleWebSocket(c *gin.Context) {
	// Get user from context (must be authenticated)
	userID := c.GetString("user_id")
	role := c.GetString("role")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Upgrade HTTP to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	client := &Client{
		ID:       userID,
		UserID:   userID,
		Role:     role,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Hub:      WSHub,
		lastPing: time.Now(),
	}

	WSHub.Register <- client

	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

// readPump reads messages from WebSocket
func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Handle incoming messages (ping, etc.)
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err == nil {
			if msg["type"] == "ping" {
				c.mu.Lock()
				c.lastPing = time.Now()
				c.mu.Unlock()
				// Send pong
				c.Send <- []byte(`{"type":"pong"}`)
			}
		}
	}
}

// writePump writes messages to WebSocket
func (c *Client) writePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// InitWebSocket initializes WebSocket hub
func InitWebSocket() {
	WSHub = NewHub()
	go WSHub.Run()
	log.Println("WebSocket hub initialized")
}

// SendNotification sends a notification to a user via WebSocket
func SendNotification(userID string, notif NotificationMessage) {
	if WSHub != nil {
		WSHub.SendToUser(userID, "notification", notif)
	}
}

// BroadcastAnnouncement broadcasts an announcement to all users
func BroadcastAnnouncement(title, message string) {
	if WSHub != nil {
		WSHub.Broadcast <- &Message{
			Type: "announcement",
			Data: map[string]string{
				"title":   title,
				"message": message,
			},
			Timestamp: time.Now(),
		}
	}
}

// GetOnlineUsers returns list of online user IDs
func GetOnlineUsers() []string {
	if WSHub == nil {
		return []string{}
	}

	WSHub.mu.RLock()
	defer WSHub.mu.RUnlock()

	users := make([]string, 0, len(WSHub.Clients))
	for userID := range WSHub.Clients {
		users = append(users, userID)
	}
	return users
}

// GetOnlineCount returns count of online users
func GetOnlineCount() int {
	if WSHub == nil {
		return 0
	}

	WSHub.mu.RLock()
	defer WSHub.mu.RUnlock()

	return len(WSHub.Clients)
}
