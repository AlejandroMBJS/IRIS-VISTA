package models

import (
	"time"
)

// ActivityType represents the type of activity
type ActivityType string

const (
	ActivityLogin         ActivityType = "login"
	ActivityLoginFailed   ActivityType = "login_failed"
	ActivityLogout        ActivityType = "logout"
	ActivityTokenRefresh  ActivityType = "token_refresh"
	ActivityPasswordReset ActivityType = "password_reset"
	ActivityRegistration  ActivityType = "registration"
)

// ActivityLog tracks user authentication and session activities
type ActivityLog struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	UserID      *uint        `gorm:"index" json:"user_id"`
	User        *User        `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Type        ActivityType `gorm:"not null;size:50;index" json:"type"`
	Success     bool         `gorm:"default:true" json:"success"`
	IPAddress   string       `gorm:"size:45" json:"ip_address"`
	UserAgent   string       `gorm:"size:500" json:"user_agent"`
	Details     string       `gorm:"type:text" json:"details,omitempty"`
	Identifier  string       `gorm:"size:255;index" json:"identifier"` // Employee number or email used for login attempt
	SessionID   string       `gorm:"size:100;index" json:"session_id,omitempty"`
	ExpiresAt   *time.Time   `json:"expires_at,omitempty"`
	EndedAt     *time.Time   `json:"ended_at,omitempty"` // When session ended (logout or expiry)
	CreatedAt   time.Time    `gorm:"index" json:"created_at"`
}

// NewActivityLog creates a new activity log entry
func NewActivityLog(activityType ActivityType, userID *uint, identifier, ipAddress, userAgent string) *ActivityLog {
	return &ActivityLog{
		UserID:     userID,
		Type:       activityType,
		Success:    true,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		Identifier: identifier,
		CreatedAt:  time.Now(),
	}
}

// WithSuccess sets the success status
func (a *ActivityLog) WithSuccess(success bool) *ActivityLog {
	a.Success = success
	return a
}

// WithDetails adds details to the log
func (a *ActivityLog) WithDetails(details string) *ActivityLog {
	a.Details = details
	return a
}

// WithSession sets session information
func (a *ActivityLog) WithSession(sessionID string, expiresAt time.Time) *ActivityLog {
	a.SessionID = sessionID
	a.ExpiresAt = &expiresAt
	return a
}

// IsActive returns true if this is an active session (login without logout)
func (a *ActivityLog) IsActive() bool {
	if a.Type != ActivityLogin || !a.Success {
		return false
	}
	if a.EndedAt != nil {
		return false
	}
	if a.ExpiresAt != nil && time.Now().After(*a.ExpiresAt) {
		return false
	}
	return true
}

// GetDuration returns the session duration
func (a *ActivityLog) GetDuration() *time.Duration {
	if a.Type != ActivityLogin {
		return nil
	}
	endTime := time.Now()
	if a.EndedAt != nil {
		endTime = *a.EndedAt
	}
	d := endTime.Sub(a.CreatedAt)
	return &d
}
