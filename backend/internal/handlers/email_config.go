package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services/email"
	"vista-backend/pkg/crypto"
	"vista-backend/pkg/response"
)

type EmailConfigHandler struct {
	db            *gorm.DB
	emailSvc      *email.EmailService
	encryptionSvc *crypto.EncryptionService
}

func NewEmailConfigHandler(db *gorm.DB, emailSvc *email.EmailService, encryptionSvc *crypto.EncryptionService) *EmailConfigHandler {
	return &EmailConfigHandler{
		db:            db,
		emailSvc:      emailSvc,
		encryptionSvc: encryptionSvc,
	}
}

// EmailConfigRequest represents the request body for updating email config
type EmailConfigRequest struct {
	APIKey            *string `json:"api_key"`
	FromEmail         *string `json:"from_email"`
	FromName          *string `json:"from_name"`
	ReplyToEmail      *string `json:"reply_to_email"`
	Enabled           *bool   `json:"enabled"`
	SendOnApproval    *bool   `json:"send_on_approval"`
	SendOnRejection   *bool   `json:"send_on_rejection"`
	SendOnInfoRequest *bool   `json:"send_on_info_request"`
	SendOnPurchased   *bool   `json:"send_on_purchased"`
	SendOnNewRequest  *bool   `json:"send_on_new_request"`
	SendOnUrgent      *bool   `json:"send_on_urgent"`
	SendReminders     *bool   `json:"send_reminders"`
}

// EmailConfigResponse represents the response for email config
type EmailConfigResponse struct {
	ID               uint       `json:"id"`
	Provider         string     `json:"provider"`
	APIKeySet        bool       `json:"api_key_set"`
	FromEmail        string     `json:"from_email"`
	FromName         string     `json:"from_name"`
	ReplyToEmail     string     `json:"reply_to_email"`
	Enabled          bool       `json:"enabled"`
	SendOnApproval   bool       `json:"send_on_approval"`
	SendOnRejection  bool       `json:"send_on_rejection"`
	SendOnInfoRequest bool      `json:"send_on_info_request"`
	SendOnPurchased  bool       `json:"send_on_purchased"`
	SendOnNewRequest bool       `json:"send_on_new_request"`
	SendOnUrgent     bool       `json:"send_on_urgent"`
	SendReminders    bool       `json:"send_reminders"`
	LastTestAt       *time.Time `json:"last_test_at,omitempty"`
	LastTestSuccess  bool       `json:"last_test_success"`
	LastTestError    string     `json:"last_test_error,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// GetEmailConfig returns the current email configuration
func (h *EmailConfigHandler) GetEmailConfig(c *gin.Context) {
	var config models.EmailConfig
	if err := h.db.First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return default config
			defaultConfig := models.GetDefaultEmailConfig()
			response.Success(c, h.configToResponse(defaultConfig))
			return
		}
		response.InternalServerError(c, "Failed to fetch email config")
		return
	}

	response.Success(c, h.configToResponse(config))
}

// SaveEmailConfig saves or updates the email configuration
func (h *EmailConfigHandler) SaveEmailConfig(c *gin.Context) {
	var req EmailConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)

	var config models.EmailConfig
	isNew := h.db.First(&config).Error == gorm.ErrRecordNotFound

	if isNew {
		config = models.GetDefaultEmailConfig()
	}

	// Update fields if provided
	if req.APIKey != nil && *req.APIKey != "" {
		// Encrypt the API key before storing
		encrypted, err := h.encryptionSvc.Encrypt(*req.APIKey)
		if err != nil {
			response.InternalServerError(c, "Failed to encrypt API key")
			return
		}
		config.APIKey = encrypted
	}
	if req.FromEmail != nil {
		config.FromEmail = *req.FromEmail
	}
	if req.FromName != nil {
		config.FromName = *req.FromName
	}
	if req.ReplyToEmail != nil {
		config.ReplyToEmail = *req.ReplyToEmail
	}
	if req.Enabled != nil {
		config.Enabled = *req.Enabled
	}
	if req.SendOnApproval != nil {
		config.SendOnApproval = *req.SendOnApproval
	}
	if req.SendOnRejection != nil {
		config.SendOnRejection = *req.SendOnRejection
	}
	if req.SendOnInfoRequest != nil {
		config.SendOnInfoRequest = *req.SendOnInfoRequest
	}
	if req.SendOnPurchased != nil {
		config.SendOnPurchased = *req.SendOnPurchased
	}
	if req.SendOnNewRequest != nil {
		config.SendOnNewRequest = *req.SendOnNewRequest
	}
	if req.SendOnUrgent != nil {
		config.SendOnUrgent = *req.SendOnUrgent
	}
	if req.SendReminders != nil {
		config.SendReminders = *req.SendReminders
	}

	config.UpdatedByID = &userID

	var err error
	if isNew {
		err = h.db.Create(&config).Error
	} else {
		err = h.db.Save(&config).Error
	}

	if err != nil {
		response.InternalServerError(c, "Failed to save email config")
		return
	}

	response.SuccessWithMessage(c, "Email configuration saved", h.configToResponse(config))
}

// TestEmailConfig tests the email configuration by sending a test email
func (h *EmailConfigHandler) TestEmailConfig(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Valid email address is required")
		return
	}

	// Get current config
	var config models.EmailConfig
	if err := h.db.First(&config).Error; err != nil {
		response.BadRequest(c, "Email configuration not found. Please save configuration first.")
		return
	}

	// Decrypt API key for testing
	if config.APIKey != "" {
		decrypted, err := h.encryptionSvc.Decrypt(config.APIKey)
		if err != nil {
			response.InternalServerError(c, "Failed to decrypt API key")
			return
		}
		config.APIKey = decrypted
	}

	// Update config temporarily with decrypted key for test
	h.db.Model(&config).Updates(map[string]interface{}{
		"api_key": config.APIKey,
	})

	// Test the connection
	err := h.emailSvc.TestConnection(req.Email)

	// Record test result
	now := time.Now()
	config.LastTestAt = &now
	if err != nil {
		config.LastTestSuccess = false
		config.LastTestError = err.Error()
		h.db.Model(&config).Updates(map[string]interface{}{
			"last_test_at":      now,
			"last_test_success": false,
			"last_test_error":   err.Error(),
		})
		response.BadRequest(c, "Test failed: "+err.Error())
		return
	}

	config.LastTestSuccess = true
	config.LastTestError = ""
	h.db.Model(&config).Updates(map[string]interface{}{
		"last_test_at":      now,
		"last_test_success": true,
		"last_test_error":   "",
	})

	response.SuccessWithMessage(c, "Test email sent successfully to "+req.Email, nil)
}

// configToResponse converts an EmailConfig model to response
func (h *EmailConfigHandler) configToResponse(config models.EmailConfig) EmailConfigResponse {
	return EmailConfigResponse{
		ID:               config.ID,
		Provider:         config.Provider,
		APIKeySet:        config.APIKey != "",
		FromEmail:        config.FromEmail,
		FromName:         config.FromName,
		ReplyToEmail:     config.ReplyToEmail,
		Enabled:          config.Enabled,
		SendOnApproval:   config.SendOnApproval,
		SendOnRejection:  config.SendOnRejection,
		SendOnInfoRequest: config.SendOnInfoRequest,
		SendOnPurchased:  config.SendOnPurchased,
		SendOnNewRequest: config.SendOnNewRequest,
		SendOnUrgent:     config.SendOnUrgent,
		SendReminders:    config.SendReminders,
		LastTestAt:       config.LastTestAt,
		LastTestSuccess:  config.LastTestSuccess,
		LastTestError:    config.LastTestError,
		CreatedAt:        config.CreatedAt,
		UpdatedAt:        config.UpdatedAt,
	}
}
