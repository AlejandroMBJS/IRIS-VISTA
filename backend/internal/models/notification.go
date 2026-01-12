package models

import (
	"time"

	"gorm.io/gorm"
)

// NotificationType represents different types of notifications
type NotificationType string

const (
	NotificationRequestCreated      NotificationType = "request_created"
	NotificationRequestApproved     NotificationType = "request_approved"
	NotificationRequestRejected     NotificationType = "request_rejected"
	NotificationRequestInfoRequired NotificationType = "request_info_required"
	NotificationRequestPurchased    NotificationType = "request_purchased"
	NotificationNewPendingRequest   NotificationType = "new_pending_request"
	NotificationUrgentRequest       NotificationType = "urgent_request"
	NotificationNewApprovedOrder    NotificationType = "new_approved_order"
	NotificationReminderPending     NotificationType = "reminder_pending"
	NotificationReminderUnpurchased NotificationType = "reminder_unpurchased"
)

// Notification represents an in-app notification
type Notification struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	UserID        uint             `gorm:"not null;index" json:"user_id"`
	User          User             `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type          NotificationType `gorm:"size:50;not null" json:"type"`
	Title         string           `gorm:"size:200;not null" json:"title"`
	Message       string           `gorm:"type:text" json:"message"`
	ReferenceType string           `gorm:"size:50" json:"reference_type,omitempty"` // e.g., "purchase_request"
	ReferenceID   uint             `json:"reference_id,omitempty"`
	ActionURL     string           `gorm:"size:500" json:"action_url,omitempty"`
	ReadAt        *time.Time       `json:"read_at,omitempty"`
	EmailSentAt   *time.Time       `json:"email_sent_at,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
	DeletedAt     gorm.DeletedAt   `gorm:"index" json:"-"`
}

// IsRead returns true if the notification has been read
func (n *Notification) IsRead() bool {
	return n.ReadAt != nil
}

// MarkAsRead marks the notification as read
func (n *Notification) MarkAsRead() {
	now := time.Now()
	n.ReadAt = &now
}

// NotificationCount holds the count of unread notifications
type NotificationCount struct {
	Unread int64 `json:"unread"`
	Total  int64 `json:"total"`
}

// Helper function to create notifications
func NewNotification(userID uint, notificationType NotificationType, title, message string) *Notification {
	return &Notification{
		UserID:  userID,
		Type:    notificationType,
		Title:   title,
		Message: message,
	}
}

// WithReference adds a reference to the notification
func (n *Notification) WithReference(refType string, refID uint) *Notification {
	n.ReferenceType = refType
	n.ReferenceID = refID
	return n
}

// WithActionURL adds an action URL to the notification
func (n *Notification) WithActionURL(url string) *Notification {
	n.ActionURL = url
	return n
}
