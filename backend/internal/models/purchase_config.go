package models

import (
	"encoding/json"
	"time"
)

// PurchaseConfig stores configuration for the purchase request module (singleton)
type PurchaseConfig struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// General Configuration
	ModuleName           string `gorm:"size:100;default:Solicitudes de Compra" json:"module_name"`
	ModuleDescription    string `gorm:"type:text" json:"module_description"`
	ModuleActive         bool   `gorm:"default:true" json:"module_active"`
	AllowUrgent          bool   `gorm:"default:true" json:"allow_urgent"`
	RequireJustification bool   `gorm:"default:true" json:"require_justification"`

	// Metadata Extraction
	ExtractionTimeoutSeconds int    `gorm:"default:10" json:"extraction_timeout_seconds"`
	AllowManualEdit          bool   `gorm:"default:true" json:"allow_manual_edit"`
	CacheEnabled             bool   `gorm:"default:true" json:"cache_enabled"`
	CacheDurationHours       int    `gorm:"default:24" json:"cache_duration_hours"`
	CustomUserAgent          string `gorm:"type:text" json:"custom_user_agent"`
	AllowedDomains           string `gorm:"type:text" json:"allowed_domains"`  // JSON array or newline-separated
	BlockedDomains           string `gorm:"type:text" json:"blocked_domains"`  // JSON array or newline-separated

	// Approval Flow
	DefaultApproverID     *uint   `json:"default_approver_id"`
	DefaultApprover       User    `gorm:"foreignKey:DefaultApproverID" json:"default_approver,omitempty"`
	AutoApproveEnabled    bool    `gorm:"default:false" json:"auto_approve_enabled"`
	AutoApproveMaxAmount  float64 `gorm:"type:decimal(10,2);default:500.00" json:"auto_approve_max_amount"`
	ApprovalLevels        string  `gorm:"type:text" json:"approval_levels"` // JSON: [{"max_amount": 5000, "approver_role": "general_manager"}, ...]

	// Notifications - Requester
	NotifyRequesterApproved       bool `gorm:"default:true" json:"notify_requester_approved"`
	NotifyRequesterRejected       bool `gorm:"default:true" json:"notify_requester_rejected"`
	NotifyRequesterInfoRequested  bool `gorm:"default:true" json:"notify_requester_info_requested"`
	NotifyRequesterPurchased      bool `gorm:"default:true" json:"notify_requester_purchased"`

	// Notifications - Approver
	NotifyApproverNewRequest bool `gorm:"default:true" json:"notify_approver_new_request"`
	NotifyApproverUrgent     bool `gorm:"default:true" json:"notify_approver_urgent"`

	// Notifications - Admin
	NotifyAdminNewApproved bool `gorm:"default:true" json:"notify_admin_new_approved"`

	// Reminders
	ReminderPendingHours     int `gorm:"default:24" json:"reminder_pending_hours"`
	ReminderUnpurchasedHours int `gorm:"default:48" json:"reminder_unpurchased_hours"`

	// Form Fields
	RequireCostCenter  bool   `gorm:"default:false" json:"require_cost_center"`
	RequireProject     bool   `gorm:"default:false" json:"require_project"`
	RequireBudgetCode  bool   `gorm:"default:false" json:"require_budget_code"`
	CustomFields       string `gorm:"type:text" json:"custom_fields"` // JSON array of custom field definitions

	// Admin Panel
	AdminDefaultView    string `gorm:"size:20;default:table" json:"admin_default_view"` // cards, table
	AdminVisibleColumns string `gorm:"type:text" json:"admin_visible_columns"`          // JSON array
	AdminDefaultSort    string `gorm:"size:50;default:approved_at_desc" json:"admin_default_sort"`

	// Metadata
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	UpdatedByID *uint     `json:"updated_by_id"`
	UpdatedBy   User      `gorm:"foreignKey:UpdatedByID" json:"updated_by,omitempty"`
}

// ApprovalLevel represents a level in the approval hierarchy
type ApprovalLevel struct {
	MaxAmount    float64 `json:"max_amount"`
	ApproverRole string  `json:"approver_role"`
	ApproverID   *uint   `json:"approver_id,omitempty"`
}

// CustomField represents a custom form field definition
type CustomField struct {
	Name     string   `json:"name"`
	Label    string   `json:"label"`
	LabelZh  string   `json:"label_zh,omitempty"`
	LabelEs  string   `json:"label_es,omitempty"`
	Type     string   `json:"type"` // text, number, select, textarea
	Required bool     `json:"required"`
	Options  []string `json:"options,omitempty"` // For select type
}

// GetApprovalLevels parses and returns the approval levels
func (pc *PurchaseConfig) GetApprovalLevels() []ApprovalLevel {
	if pc.ApprovalLevels == "" {
		return []ApprovalLevel{}
	}
	var levels []ApprovalLevel
	if err := json.Unmarshal([]byte(pc.ApprovalLevels), &levels); err != nil {
		return []ApprovalLevel{}
	}
	return levels
}

// SetApprovalLevels sets the approval levels from a slice
func (pc *PurchaseConfig) SetApprovalLevels(levels []ApprovalLevel) error {
	data, err := json.Marshal(levels)
	if err != nil {
		return err
	}
	pc.ApprovalLevels = string(data)
	return nil
}

// GetCustomFields parses and returns the custom fields
func (pc *PurchaseConfig) GetCustomFields() []CustomField {
	if pc.CustomFields == "" {
		return []CustomField{}
	}
	var fields []CustomField
	if err := json.Unmarshal([]byte(pc.CustomFields), &fields); err != nil {
		return []CustomField{}
	}
	return fields
}

// SetCustomFields sets the custom fields from a slice
func (pc *PurchaseConfig) SetCustomFields(fields []CustomField) error {
	data, err := json.Marshal(fields)
	if err != nil {
		return err
	}
	pc.CustomFields = string(data)
	return nil
}

// GetAllowedDomainsList returns allowed domains as a slice
func (pc *PurchaseConfig) GetAllowedDomainsList() []string {
	return pc.parseDomainList(pc.AllowedDomains)
}

// GetBlockedDomainsList returns blocked domains as a slice
func (pc *PurchaseConfig) GetBlockedDomainsList() []string {
	return pc.parseDomainList(pc.BlockedDomains)
}

// parseDomainList parses a domain list (JSON array or newline-separated)
func (pc *PurchaseConfig) parseDomainList(domains string) []string {
	if domains == "" {
		return []string{}
	}

	// Try JSON first
	var list []string
	if err := json.Unmarshal([]byte(domains), &list); err == nil {
		return list
	}

	// Fall back to newline-separated
	var result []string
	for _, line := range splitLines(domains) {
		if line != "" {
			result = append(result, line)
		}
	}
	return result
}

// GetAdminVisibleColumnsList returns visible columns as a slice
func (pc *PurchaseConfig) GetAdminVisibleColumnsList() []string {
	if pc.AdminVisibleColumns == "" {
		// Default columns
		return []string{"image", "title", "quantity", "price", "requester", "approved_at", "url"}
	}
	var cols []string
	if err := json.Unmarshal([]byte(pc.AdminVisibleColumns), &cols); err != nil {
		return []string{"image", "title", "quantity", "price", "requester", "approved_at", "url"}
	}
	return cols
}

// SetAdminVisibleColumns sets visible columns from a slice
func (pc *PurchaseConfig) SetAdminVisibleColumns(cols []string) error {
	data, err := json.Marshal(cols)
	if err != nil {
		return err
	}
	pc.AdminVisibleColumns = string(data)
	return nil
}

// IsDomainAllowed checks if a domain is allowed based on configuration
func (pc *PurchaseConfig) IsDomainAllowed(domain string) bool {
	blocked := pc.GetBlockedDomainsList()
	for _, d := range blocked {
		if d == domain {
			return false
		}
	}

	allowed := pc.GetAllowedDomainsList()
	if len(allowed) == 0 {
		return true // No allowed list means all are allowed
	}

	for _, d := range allowed {
		if d == domain {
			return true
		}
	}
	return false
}

// GetDefaultConfig returns a PurchaseConfig with default values
func GetDefaultPurchaseConfig() PurchaseConfig {
	return PurchaseConfig{
		ModuleName:               "Solicitudes de Compra",
		ModuleDescription:        "Sistema para solicitar compras de productos y servicios",
		ModuleActive:             true,
		AllowUrgent:              true,
		RequireJustification:     true,
		ExtractionTimeoutSeconds: 10,
		AllowManualEdit:          true,
		CacheEnabled:             true,
		CacheDurationHours:       24,
		AutoApproveEnabled:       false,
		AutoApproveMaxAmount:     500.00,
		NotifyRequesterApproved:       true,
		NotifyRequesterRejected:       true,
		NotifyRequesterInfoRequested:  true,
		NotifyRequesterPurchased:      true,
		NotifyApproverNewRequest:      true,
		NotifyApproverUrgent:          true,
		NotifyAdminNewApproved:        true,
		ReminderPendingHours:          24,
		ReminderUnpurchasedHours:      48,
		RequireCostCenter:             false,
		RequireProject:                false,
		RequireBudgetCode:             false,
		AdminDefaultView:              "table",
		AdminDefaultSort:              "approved_at_desc",
	}
}

// Helper function to split string by newlines
func splitLines(s string) []string {
	var lines []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' || s[i] == '\r' {
			if i > start {
				lines = append(lines, s[start:i])
			}
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}
