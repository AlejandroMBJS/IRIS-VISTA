package models

import (
	"time"
)

// EmailConfig stores configuration for email notifications (singleton)
type EmailConfig struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// Provider Configuration
	Provider           string `gorm:"size:50;default:resend" json:"provider"` // resend, smtp, etc.
	APIKey             string `gorm:"size:500" json:"-"`                       // Encrypted, never sent to frontend
	APIKeySet          bool   `gorm:"-" json:"api_key_set"`                   // Computed field for frontend
	FromEmail          string `gorm:"size:200" json:"from_email"`
	FromName           string `gorm:"size:100" json:"from_name"`
	ReplyToEmail       string `gorm:"size:200" json:"reply_to_email"`

	// Feature Flags
	Enabled            bool   `gorm:"default:false" json:"enabled"`
	SendOnApproval     bool   `gorm:"default:true" json:"send_on_approval"`
	SendOnRejection    bool   `gorm:"default:true" json:"send_on_rejection"`
	SendOnInfoRequest  bool   `gorm:"default:true" json:"send_on_info_request"`
	SendOnPurchased    bool   `gorm:"default:true" json:"send_on_purchased"`
	SendOnNewRequest   bool   `gorm:"default:true" json:"send_on_new_request"`
	SendOnUrgent       bool   `gorm:"default:true" json:"send_on_urgent"`
	SendReminders      bool   `gorm:"default:false" json:"send_reminders"`

	// Templates (optional custom overrides)
	TemplateApproval   string `gorm:"type:text" json:"template_approval"`
	TemplateRejection  string `gorm:"type:text" json:"template_rejection"`
	TemplateInfoReq    string `gorm:"type:text" json:"template_info_request"`
	TemplatePurchased  string `gorm:"type:text" json:"template_purchased"`
	TemplateNewRequest string `gorm:"type:text" json:"template_new_request"`
	TemplateReminder   string `gorm:"type:text" json:"template_reminder"`

	// Status tracking
	LastTestAt      *time.Time `json:"last_test_at,omitempty"`
	LastTestSuccess bool       `json:"last_test_success"`
	LastTestError   string     `gorm:"size:500" json:"last_test_error,omitempty"`

	// Metadata
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	UpdatedByID *uint     `json:"updated_by_id"`
	UpdatedBy   User      `gorm:"foreignKey:UpdatedByID" json:"updated_by,omitempty"`
}

// CanSendEmail returns true if email sending is configured and enabled
func (ec *EmailConfig) CanSendEmail() bool {
	return ec.Enabled && ec.APIKey != "" && ec.FromEmail != ""
}

// GetDefaultEmailConfig returns an EmailConfig with default values
func GetDefaultEmailConfig() EmailConfig {
	return EmailConfig{
		Provider:          "resend",
		FromName:          "IRIS Vista",
		Enabled:           false,
		SendOnApproval:    true,
		SendOnRejection:   true,
		SendOnInfoRequest: true,
		SendOnPurchased:   true,
		SendOnNewRequest:  true,
		SendOnUrgent:      true,
		SendReminders:     false,
	}
}
