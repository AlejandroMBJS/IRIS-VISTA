package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/pkg/response"
)

type ActivityLogHandler struct {
	db *gorm.DB
}

func NewActivityLogHandler(db *gorm.DB) *ActivityLogHandler {
	return &ActivityLogHandler{db: db}
}

// getCurrentUser retrieves the current user from context
func (h *ActivityLogHandler) getCurrentUser(c *gin.Context) *models.User {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		return nil
	}
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return nil
	}
	return &user
}

// ActivityLogResponse represents the response for activity logs
type ActivityLogResponse struct {
	ID         uint                   `json:"id"`
	UserID     *uint                  `json:"user_id"`
	UserName   string                 `json:"user_name"`
	UserEmail  string                 `json:"user_email"`
	Type       models.ActivityType    `json:"type"`
	Success    bool                   `json:"success"`
	IPAddress  string                 `json:"ip_address"`
	UserAgent  string                 `json:"user_agent"`
	Details    string                 `json:"details,omitempty"`
	Identifier string                 `json:"identifier"`
	SessionID  string                 `json:"session_id,omitempty"`
	ExpiresAt  *time.Time             `json:"expires_at,omitempty"`
	EndedAt    *time.Time             `json:"ended_at,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
	IsActive   bool                   `json:"is_active"`
	Duration   *int64                 `json:"duration_seconds,omitempty"`
}

// ActivityStats represents activity statistics
type ActivityStats struct {
	TotalLogins        int64 `json:"total_logins"`
	FailedLogins       int64 `json:"failed_logins"`
	ActiveSessions     int64 `json:"active_sessions"`
	UniqueUsers        int64 `json:"unique_users"`
	TodayLogins        int64 `json:"today_logins"`
	TodayFailedLogins  int64 `json:"today_failed_logins"`
}

// GetActivityLogs returns paginated activity logs (admin only)
func (h *ActivityLogHandler) GetActivityLogs(c *gin.Context) {
	user := h.getCurrentUser(c)
	if user == nil || !user.IsAdmin() {
		response.Forbidden(c, "Admin access required")
		return
	}

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}

	// Parse filters
	activityType := c.Query("type")
	userID := c.Query("user_id")
	success := c.Query("success")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	search := c.Query("search")

	query := h.db.Model(&models.ActivityLog{}).Preload("User")

	// Apply filters
	if activityType != "" {
		query = query.Where("type = ?", activityType)
	}
	if userID != "" {
		query = query.Where("user_id = ?", userID)
	}
	if success != "" {
		query = query.Where("success = ?", success == "true")
	}
	if startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", t)
		}
	}
	if endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("created_at < ?", t.AddDate(0, 0, 1))
		}
	}
	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("identifier LIKE ? OR ip_address LIKE ? OR details LIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// Count total
	var total int64
	query.Count(&total)

	// Get paginated results
	var logs []models.ActivityLog
	offset := (page - 1) * perPage
	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&logs).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch activity logs")
		return
	}

	// Convert to response format
	responses := make([]ActivityLogResponse, len(logs))
	for i, log := range logs {
		resp := ActivityLogResponse{
			ID:         log.ID,
			UserID:     log.UserID,
			Type:       log.Type,
			Success:    log.Success,
			IPAddress:  log.IPAddress,
			UserAgent:  log.UserAgent,
			Details:    log.Details,
			Identifier: log.Identifier,
			SessionID:  log.SessionID,
			ExpiresAt:  log.ExpiresAt,
			EndedAt:    log.EndedAt,
			CreatedAt:  log.CreatedAt,
			IsActive:   log.IsActive(),
		}
		if log.User != nil {
			resp.UserName = log.User.Name
			resp.UserEmail = log.User.Email
		}
		if d := log.GetDuration(); d != nil {
			seconds := int64(d.Seconds())
			resp.Duration = &seconds
		}
		responses[i] = resp
	}

	response.Success(c, gin.H{
		"data":     responses,
		"total":    total,
		"page":     page,
		"per_page": perPage,
		"pages":    (total + int64(perPage) - 1) / int64(perPage),
	})
}

// GetActivityStats returns activity statistics (admin only)
func (h *ActivityLogHandler) GetActivityStats(c *gin.Context) {
	user := h.getCurrentUser(c)
	if user == nil || !user.IsAdmin() {
		response.Forbidden(c, "Admin access required")
		return
	}

	stats := ActivityStats{}

	// Total logins
	h.db.Model(&models.ActivityLog{}).Where("type = ? AND success = ?", models.ActivityLogin, true).Count(&stats.TotalLogins)

	// Failed logins
	h.db.Model(&models.ActivityLog{}).Where("type = ? AND success = ?", models.ActivityLoginFailed, true).
		Or("type = ? AND success = ?", models.ActivityLogin, false).Count(&stats.FailedLogins)

	// Active sessions (logins without logout and not expired)
	h.db.Model(&models.ActivityLog{}).
		Where("type = ? AND success = ? AND ended_at IS NULL AND (expires_at IS NULL OR expires_at > ?)",
			models.ActivityLogin, true, time.Now()).Count(&stats.ActiveSessions)

	// Unique users who logged in
	h.db.Model(&models.ActivityLog{}).
		Where("type = ? AND success = ? AND user_id IS NOT NULL", models.ActivityLogin, true).
		Distinct("user_id").Count(&stats.UniqueUsers)

	// Today's logins
	today := time.Now().Truncate(24 * time.Hour)
	h.db.Model(&models.ActivityLog{}).
		Where("type = ? AND success = ? AND created_at >= ?", models.ActivityLogin, true, today).
		Count(&stats.TodayLogins)

	// Today's failed logins
	h.db.Model(&models.ActivityLog{}).
		Where("(type = ? OR (type = ? AND success = ?)) AND created_at >= ?",
			models.ActivityLoginFailed, models.ActivityLogin, false, today).
		Count(&stats.TodayFailedLogins)

	response.Success(c, stats)
}

// GetActiveSessions returns currently active sessions (admin only)
func (h *ActivityLogHandler) GetActiveSessions(c *gin.Context) {
	user := h.getCurrentUser(c)
	if user == nil || !user.IsAdmin() {
		response.Forbidden(c, "Admin access required")
		return
	}

	var logs []models.ActivityLog
	if err := h.db.Preload("User").
		Where("type = ? AND success = ? AND ended_at IS NULL AND (expires_at IS NULL OR expires_at > ?)",
			models.ActivityLogin, true, time.Now()).
		Order("created_at DESC").
		Find(&logs).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch active sessions")
		return
	}

	responses := make([]ActivityLogResponse, len(logs))
	for i, log := range logs {
		resp := ActivityLogResponse{
			ID:         log.ID,
			UserID:     log.UserID,
			Type:       log.Type,
			Success:    log.Success,
			IPAddress:  log.IPAddress,
			UserAgent:  log.UserAgent,
			Identifier: log.Identifier,
			SessionID:  log.SessionID,
			ExpiresAt:  log.ExpiresAt,
			CreatedAt:  log.CreatedAt,
			IsActive:   true,
		}
		if log.User != nil {
			resp.UserName = log.User.Name
			resp.UserEmail = log.User.Email
		}
		if d := log.GetDuration(); d != nil {
			seconds := int64(d.Seconds())
			resp.Duration = &seconds
		}
		responses[i] = resp
	}

	response.Success(c, responses)
}

// EndSession ends a specific session (admin only)
func (h *ActivityLogHandler) EndSession(c *gin.Context) {
	user := h.getCurrentUser(c)
	if user == nil || !user.IsAdmin() {
		response.Forbidden(c, "Admin access required")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid session ID")
		return
	}

	var log models.ActivityLog
	if err := h.db.First(&log, id).Error; err != nil {
		response.NotFound(c, "Session not found")
		return
	}

	now := time.Now()
	log.EndedAt = &now
	log.Details = "Session ended by admin: " + user.Name

	if err := h.db.Save(&log).Error; err != nil {
		response.InternalServerError(c, "Failed to end session")
		return
	}

	response.Success(c, gin.H{"message": "Session ended successfully"})
}
