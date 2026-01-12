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

type NotificationHandler struct {
	db *gorm.DB
}

func NewNotificationHandler(db *gorm.DB) *NotificationHandler {
	return &NotificationHandler{db: db}
}

// NotificationResponse represents a notification in API responses
type NotificationResponse struct {
	ID            uint       `json:"id"`
	Type          string     `json:"type"`
	Title         string     `json:"title"`
	Message       string     `json:"message"`
	ReferenceType string     `json:"reference_type,omitempty"`
	ReferenceID   uint       `json:"reference_id,omitempty"`
	ActionURL     string     `json:"action_url,omitempty"`
	IsRead        bool       `json:"is_read"`
	ReadAt        *time.Time `json:"read_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

func notificationToResponse(n models.Notification) NotificationResponse {
	return NotificationResponse{
		ID:            n.ID,
		Type:          string(n.Type),
		Title:         n.Title,
		Message:       n.Message,
		ReferenceType: n.ReferenceType,
		ReferenceID:   n.ReferenceID,
		ActionURL:     n.ActionURL,
		IsRead:        n.IsRead(),
		ReadAt:        n.ReadAt,
		CreatedAt:     n.CreatedAt,
	}
}

// ListNotifications returns the user's notifications
func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	userID := middleware.GetUserID(c)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	unreadOnly := c.Query("unread") == "true"

	offset := (page - 1) * perPage

	query := h.db.Model(&models.Notification{}).Where("user_id = ?", userID)

	if unreadOnly {
		query = query.Where("read_at IS NULL")
	}

	var total int64
	query.Count(&total)

	var notifications []models.Notification
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&notifications).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch notifications")
		return
	}

	results := make([]NotificationResponse, len(notifications))
	for i, n := range notifications {
		results[i] = notificationToResponse(n)
	}

	response.SuccessWithMeta(c, results, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: response.CalculateTotalPages(total, perPage),
	})
}

// GetNotificationCount returns the count of unread notifications
func (h *NotificationHandler) GetNotificationCount(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var count models.NotificationCount

	h.db.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Count(&count.Unread)

	h.db.Model(&models.Notification{}).
		Where("user_id = ?", userID).
		Count(&count.Total)

	response.Success(c, count)
}

// MarkAsRead marks a single notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid notification ID")
		return
	}

	var notification models.Notification
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&notification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Notification not found")
		} else {
			response.InternalServerError(c, "Failed to fetch notification")
		}
		return
	}

	if notification.IsRead() {
		response.Success(c, notificationToResponse(notification))
		return
	}

	notification.MarkAsRead()
	if err := h.db.Save(&notification).Error; err != nil {
		response.InternalServerError(c, "Failed to mark notification as read")
		return
	}

	response.Success(c, notificationToResponse(notification))
}

// MarkAllAsRead marks all notifications as read for the user
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID := middleware.GetUserID(c)

	now := time.Now()
	result := h.db.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Update("read_at", now)

	if result.Error != nil {
		response.InternalServerError(c, "Failed to mark notifications as read")
		return
	}

	response.SuccessWithMessage(c, "All notifications marked as read", gin.H{
		"updated": result.RowsAffected,
	})
}

// GetPendingCounts returns pending counts for badges (approvals, orders)
// This is a convenience endpoint for the sidebar badges
func (h *NotificationHandler) GetPendingCounts(c *gin.Context) {
	userID := middleware.GetUserID(c)
	userRole := middleware.GetUserRole(c)

	counts := gin.H{
		"unread_notifications": int64(0),
		"pending_approvals":    int64(0),
		"pending_orders":       int64(0),
	}

	// Get unread notifications count
	var unreadNotifications int64
	h.db.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Count(&unreadNotifications)
	counts["unread_notifications"] = unreadNotifications

	// Pending approvals count (for GM and Admin)
	if userRole == string(models.RoleGeneralManager) || userRole == string(models.RoleAdmin) {
		var pendingApprovals int64
		h.db.Model(&models.PurchaseRequest{}).
			Where("status = ?", models.StatusPending).
			Count(&pendingApprovals)
		counts["pending_approvals"] = pendingApprovals
	}

	// Pending orders count (for Admin and Purchase Admin)
	if userRole == string(models.RoleAdmin) || userRole == string(models.RolePurchaseAdmin) {
		var pendingOrders int64
		h.db.Model(&models.PurchaseRequest{}).
			Where("status = ?", models.StatusApproved).
			Count(&pendingOrders)
		counts["pending_orders"] = pendingOrders
	}

	response.Success(c, counts)
}
