package handlers

import (
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services/metadata"
	"vista-backend/pkg/response"
)

type PurchaseConfigHandler struct {
	db          *gorm.DB
	metadataSvc *metadata.Service
}

func NewPurchaseConfigHandler(db *gorm.DB, metadataSvc *metadata.Service) *PurchaseConfigHandler {
	return &PurchaseConfigHandler{
		db:          db,
		metadataSvc: metadataSvc,
	}
}

// PurchaseConfigRequest represents the request body for updating purchase config
type PurchaseConfigRequest struct {
	// General
	ModuleName           *string `json:"module_name"`
	ModuleDescription    *string `json:"module_description"`
	ModuleActive         *bool   `json:"module_active"`
	AllowUrgent          *bool   `json:"allow_urgent"`
	RequireJustification *bool   `json:"require_justification"`

	// Metadata Extraction
	ExtractionTimeoutSeconds *int    `json:"extraction_timeout_seconds"`
	AllowManualEdit          *bool   `json:"allow_manual_edit"`
	CacheEnabled             *bool   `json:"cache_enabled"`
	CacheDurationHours       *int    `json:"cache_duration_hours"`
	CustomUserAgent          *string `json:"custom_user_agent"`
	AllowedDomains           *string `json:"allowed_domains"`
	BlockedDomains           *string `json:"blocked_domains"`

	// Approval Flow
	DefaultApproverID    *uint                  `json:"default_approver_id"`
	AutoApproveEnabled   *bool                  `json:"auto_approve_enabled"`
	AutoApproveMaxAmount *float64               `json:"auto_approve_max_amount"`
	ApprovalLevels       []models.ApprovalLevel `json:"approval_levels"`

	// Notifications - Requester
	NotifyRequesterApproved      *bool `json:"notify_requester_approved"`
	NotifyRequesterRejected      *bool `json:"notify_requester_rejected"`
	NotifyRequesterInfoRequested *bool `json:"notify_requester_info_requested"`
	NotifyRequesterPurchased     *bool `json:"notify_requester_purchased"`

	// Notifications - Approver
	NotifyApproverNewRequest *bool `json:"notify_approver_new_request"`
	NotifyApproverUrgent     *bool `json:"notify_approver_urgent"`

	// Notifications - Admin
	NotifyAdminNewApproved *bool `json:"notify_admin_new_approved"`

	// Reminders
	ReminderPendingHours     *int `json:"reminder_pending_hours"`
	ReminderUnpurchasedHours *int `json:"reminder_unpurchased_hours"`

	// Form Fields
	RequireCostCenter *bool                `json:"require_cost_center"`
	RequireProject    *bool                `json:"require_project"`
	RequireBudgetCode *bool                `json:"require_budget_code"`
	CustomFields      []models.CustomField `json:"custom_fields"`

	// Purchase Request Options
	ShowInternalCatalog *bool `json:"show_internal_catalog"`

	// Admin Panel
	AdminDefaultView    *string  `json:"admin_default_view"`
	AdminVisibleColumns []string `json:"admin_visible_columns"`
	AdminDefaultSort    *string  `json:"admin_default_sort"`
}

// PurchaseConfigResponse represents the response for purchase config
type PurchaseConfigResponse struct {
	ID uint `json:"id"`

	// General
	ModuleName           string `json:"module_name"`
	ModuleDescription    string `json:"module_description"`
	ModuleActive         bool   `json:"module_active"`
	AllowUrgent          bool   `json:"allow_urgent"`
	RequireJustification bool   `json:"require_justification"`

	// Metadata Extraction
	ExtractionTimeoutSeconds int      `json:"extraction_timeout_seconds"`
	AllowManualEdit          bool     `json:"allow_manual_edit"`
	CacheEnabled             bool     `json:"cache_enabled"`
	CacheDurationHours       int      `json:"cache_duration_hours"`
	CustomUserAgent          string   `json:"custom_user_agent"`
	AllowedDomains           []string `json:"allowed_domains"`
	BlockedDomains           []string `json:"blocked_domains"`

	// Approval Flow
	DefaultApproverID    *uint                  `json:"default_approver_id"`
	DefaultApprover      *UserBasicResponse     `json:"default_approver,omitempty"`
	AutoApproveEnabled   bool                   `json:"auto_approve_enabled"`
	AutoApproveMaxAmount float64                `json:"auto_approve_max_amount"`
	ApprovalLevels       []models.ApprovalLevel `json:"approval_levels"`

	// Notifications - Requester
	NotifyRequesterApproved      bool `json:"notify_requester_approved"`
	NotifyRequesterRejected      bool `json:"notify_requester_rejected"`
	NotifyRequesterInfoRequested bool `json:"notify_requester_info_requested"`
	NotifyRequesterPurchased     bool `json:"notify_requester_purchased"`

	// Notifications - Approver
	NotifyApproverNewRequest bool `json:"notify_approver_new_request"`
	NotifyApproverUrgent     bool `json:"notify_approver_urgent"`

	// Notifications - Admin
	NotifyAdminNewApproved bool `json:"notify_admin_new_approved"`

	// Reminders
	ReminderPendingHours     int `json:"reminder_pending_hours"`
	ReminderUnpurchasedHours int `json:"reminder_unpurchased_hours"`

	// Form Fields
	RequireCostCenter bool                 `json:"require_cost_center"`
	RequireProject    bool                 `json:"require_project"`
	RequireBudgetCode bool                 `json:"require_budget_code"`
	CustomFields      []models.CustomField `json:"custom_fields"`

	// Purchase Request Options
	ShowInternalCatalog bool `json:"show_internal_catalog"`

	// Admin Panel
	AdminDefaultView    string   `json:"admin_default_view"`
	AdminVisibleColumns []string `json:"admin_visible_columns"`
	AdminDefaultSort    string   `json:"admin_default_sort"`

	// Metadata
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// UserBasicResponse represents basic user info
type UserBasicResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

// GetPurchaseConfig returns the current purchase configuration
func (h *PurchaseConfigHandler) GetPurchaseConfig(c *gin.Context) {
	var config models.PurchaseConfig
	if err := h.db.Preload("DefaultApprover").First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return default config
			defaultConfig := models.GetDefaultPurchaseConfig()
			response.Success(c, h.configToResponse(defaultConfig))
			return
		}
		response.InternalServerError(c, "Failed to fetch purchase config")
		return
	}

	response.Success(c, h.configToResponse(config))
}

// PublicConfigResponse represents the public-facing purchase config
type PublicConfigResponse struct {
	ModuleName           string `json:"module_name"`
	ModuleDescription    string `json:"module_description"`
	ModuleActive         bool   `json:"module_active"`
	AllowUrgent          bool   `json:"allow_urgent"`
	RequireJustification bool   `json:"require_justification"`
	ShowInternalCatalog  bool   `json:"show_internal_catalog"`
	RequireCostCenter    bool   `json:"require_cost_center"`
	RequireProject       bool   `json:"require_project"`
	RequireBudgetCode    bool   `json:"require_budget_code"`
}

// GetPublicConfig returns public-facing configuration for authenticated users
func (h *PurchaseConfigHandler) GetPublicConfig(c *gin.Context) {
	var config models.PurchaseConfig
	if err := h.db.First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			config = models.GetDefaultPurchaseConfig()
		} else {
			response.InternalServerError(c, "Failed to fetch purchase config")
			return
		}
	}

	response.Success(c, PublicConfigResponse{
		ModuleName:           config.ModuleName,
		ModuleDescription:    config.ModuleDescription,
		ModuleActive:         config.ModuleActive,
		AllowUrgent:          config.AllowUrgent,
		RequireJustification: config.RequireJustification,
		ShowInternalCatalog:  config.ShowInternalCatalog,
		RequireCostCenter:    config.RequireCostCenter,
		RequireProject:       config.RequireProject,
		RequireBudgetCode:    config.RequireBudgetCode,
	})
}

// SavePurchaseConfig saves or updates the purchase configuration
func (h *PurchaseConfigHandler) SavePurchaseConfig(c *gin.Context) {
	var req PurchaseConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)

	var config models.PurchaseConfig
	isNew := h.db.First(&config).Error == gorm.ErrRecordNotFound

	if isNew {
		config = models.GetDefaultPurchaseConfig()
	}

	// Update fields if provided
	if req.ModuleName != nil {
		config.ModuleName = *req.ModuleName
	}
	if req.ModuleDescription != nil {
		config.ModuleDescription = *req.ModuleDescription
	}
	if req.ModuleActive != nil {
		config.ModuleActive = *req.ModuleActive
	}
	if req.AllowUrgent != nil {
		config.AllowUrgent = *req.AllowUrgent
	}
	if req.RequireJustification != nil {
		config.RequireJustification = *req.RequireJustification
	}

	// Metadata Extraction
	if req.ExtractionTimeoutSeconds != nil {
		config.ExtractionTimeoutSeconds = *req.ExtractionTimeoutSeconds
	}
	if req.AllowManualEdit != nil {
		config.AllowManualEdit = *req.AllowManualEdit
	}
	if req.CacheEnabled != nil {
		config.CacheEnabled = *req.CacheEnabled
	}
	if req.CacheDurationHours != nil {
		config.CacheDurationHours = *req.CacheDurationHours
	}
	if req.CustomUserAgent != nil {
		config.CustomUserAgent = *req.CustomUserAgent
	}
	if req.AllowedDomains != nil {
		config.AllowedDomains = *req.AllowedDomains
	}
	if req.BlockedDomains != nil {
		config.BlockedDomains = *req.BlockedDomains
	}

	// Approval Flow
	if req.DefaultApproverID != nil {
		if *req.DefaultApproverID == 0 {
			config.DefaultApproverID = nil
		} else {
			config.DefaultApproverID = req.DefaultApproverID
		}
	}
	if req.AutoApproveEnabled != nil {
		config.AutoApproveEnabled = *req.AutoApproveEnabled
	}
	if req.AutoApproveMaxAmount != nil {
		config.AutoApproveMaxAmount = *req.AutoApproveMaxAmount
	}
	if req.ApprovalLevels != nil {
		config.SetApprovalLevels(req.ApprovalLevels)
	}

	// Notifications - Requester
	if req.NotifyRequesterApproved != nil {
		config.NotifyRequesterApproved = *req.NotifyRequesterApproved
	}
	if req.NotifyRequesterRejected != nil {
		config.NotifyRequesterRejected = *req.NotifyRequesterRejected
	}
	if req.NotifyRequesterInfoRequested != nil {
		config.NotifyRequesterInfoRequested = *req.NotifyRequesterInfoRequested
	}
	if req.NotifyRequesterPurchased != nil {
		config.NotifyRequesterPurchased = *req.NotifyRequesterPurchased
	}

	// Notifications - Approver
	if req.NotifyApproverNewRequest != nil {
		config.NotifyApproverNewRequest = *req.NotifyApproverNewRequest
	}
	if req.NotifyApproverUrgent != nil {
		config.NotifyApproverUrgent = *req.NotifyApproverUrgent
	}

	// Notifications - Admin
	if req.NotifyAdminNewApproved != nil {
		config.NotifyAdminNewApproved = *req.NotifyAdminNewApproved
	}

	// Reminders
	if req.ReminderPendingHours != nil {
		config.ReminderPendingHours = *req.ReminderPendingHours
	}
	if req.ReminderUnpurchasedHours != nil {
		config.ReminderUnpurchasedHours = *req.ReminderUnpurchasedHours
	}

	// Form Fields
	if req.RequireCostCenter != nil {
		config.RequireCostCenter = *req.RequireCostCenter
	}
	if req.RequireProject != nil {
		config.RequireProject = *req.RequireProject
	}
	if req.RequireBudgetCode != nil {
		config.RequireBudgetCode = *req.RequireBudgetCode
	}
	if req.CustomFields != nil {
		config.SetCustomFields(req.CustomFields)
	}

	// Purchase Request Options
	if req.ShowInternalCatalog != nil {
		config.ShowInternalCatalog = *req.ShowInternalCatalog
	}

	// Admin Panel
	if req.AdminDefaultView != nil {
		config.AdminDefaultView = *req.AdminDefaultView
	}
	if req.AdminVisibleColumns != nil {
		config.SetAdminVisibleColumns(req.AdminVisibleColumns)
	}
	if req.AdminDefaultSort != nil {
		config.AdminDefaultSort = *req.AdminDefaultSort
	}

	config.UpdatedByID = &userID

	var err error
	if isNew {
		err = h.db.Create(&config).Error
	} else {
		err = h.db.Save(&config).Error
	}

	if err != nil {
		response.InternalServerError(c, "Failed to save purchase config")
		return
	}

	// Reload with relations
	h.db.Preload("DefaultApprover").First(&config)

	response.SuccessWithMessage(c, "Purchase configuration saved", h.configToResponse(config))
}

// TestMetadataExtraction tests metadata extraction for a given URL
func (h *PurchaseConfigHandler) TestMetadataExtraction(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "URL is required")
		return
	}

	// Validate URL
	parsedURL, err := url.Parse(req.URL)
	if err != nil || parsedURL.Host == "" {
		response.BadRequest(c, "Invalid URL format")
		return
	}

	// Get config to check domain restrictions
	var config models.PurchaseConfig
	if err := h.db.First(&config).Error; err == nil {
		// Check if domain is allowed
		domain := parsedURL.Host
		// Remove www. prefix if present
		domain = strings.TrimPrefix(domain, "www.")

		if !config.IsDomainAllowed(domain) {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"error":   "Domain not allowed: " + domain,
			})
			return
		}
	}

	// Try to extract metadata
	if h.metadataSvc == nil {
		response.BadRequest(c, "Metadata service not available")
		return
	}

	result, err := h.metadataSvc.Extract(req.URL)
	if err != nil {
		response.BadRequest(c, "Failed to extract metadata: "+err.Error())
		return
	}

	response.Success(c, result)
}

// GetApprovers returns users who can be approvers
func (h *PurchaseConfigHandler) GetApprovers(c *gin.Context) {
	var users []models.User
	if err := h.db.Where("status = ? AND role IN ?", "active", []models.UserRole{
		models.RoleAdmin,
		models.RoleGeneralManager,
		models.RoleSupplyChainManager,
	}).Find(&users).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch users")
		return
	}

	userResponses := make([]UserBasicResponse, len(users))
	for i, u := range users {
		userResponses[i] = UserBasicResponse{
			ID:    u.ID,
			Name:  u.Name,
			Email: u.Email,
			Role:  string(u.Role),
		}
	}

	response.Success(c, userResponses)
}

// configToResponse converts a PurchaseConfig model to response
func (h *PurchaseConfigHandler) configToResponse(config models.PurchaseConfig) PurchaseConfigResponse {
	resp := PurchaseConfigResponse{
		ID:                           config.ID,
		ModuleName:                   config.ModuleName,
		ModuleDescription:            config.ModuleDescription,
		ModuleActive:                 config.ModuleActive,
		AllowUrgent:                  config.AllowUrgent,
		RequireJustification:         config.RequireJustification,
		ExtractionTimeoutSeconds:     config.ExtractionTimeoutSeconds,
		AllowManualEdit:              config.AllowManualEdit,
		CacheEnabled:                 config.CacheEnabled,
		CacheDurationHours:           config.CacheDurationHours,
		CustomUserAgent:              config.CustomUserAgent,
		AllowedDomains:               config.GetAllowedDomainsList(),
		BlockedDomains:               config.GetBlockedDomainsList(),
		DefaultApproverID:            config.DefaultApproverID,
		AutoApproveEnabled:           config.AutoApproveEnabled,
		AutoApproveMaxAmount:         config.AutoApproveMaxAmount,
		ApprovalLevels:               config.GetApprovalLevels(),
		NotifyRequesterApproved:      config.NotifyRequesterApproved,
		NotifyRequesterRejected:      config.NotifyRequesterRejected,
		NotifyRequesterInfoRequested: config.NotifyRequesterInfoRequested,
		NotifyRequesterPurchased:     config.NotifyRequesterPurchased,
		NotifyApproverNewRequest:     config.NotifyApproverNewRequest,
		NotifyApproverUrgent:         config.NotifyApproverUrgent,
		NotifyAdminNewApproved:       config.NotifyAdminNewApproved,
		ReminderPendingHours:         config.ReminderPendingHours,
		ReminderUnpurchasedHours:     config.ReminderUnpurchasedHours,
		RequireCostCenter:            config.RequireCostCenter,
		RequireProject:               config.RequireProject,
		RequireBudgetCode:            config.RequireBudgetCode,
		CustomFields:                 config.GetCustomFields(),
		ShowInternalCatalog:          config.ShowInternalCatalog,
		AdminDefaultView:             config.AdminDefaultView,
		AdminVisibleColumns:          config.GetAdminVisibleColumnsList(),
		AdminDefaultSort:             config.AdminDefaultSort,
		CreatedAt:                    config.CreatedAt,
		UpdatedAt:                    config.UpdatedAt,
	}

	if config.DefaultApproverID != nil && config.DefaultApprover.ID != 0 {
		resp.DefaultApprover = &UserBasicResponse{
			ID:    config.DefaultApprover.ID,
			Name:  config.DefaultApprover.Name,
			Email: config.DefaultApprover.Email,
			Role:  string(config.DefaultApprover.Role),
		}
	}

	return resp
}
