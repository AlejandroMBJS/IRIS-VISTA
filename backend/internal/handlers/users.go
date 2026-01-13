package handlers

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services"
	"vista-backend/pkg/response"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

type CreateUserRequest struct {
	EmployeeNumber string `json:"employee_number" binding:"required,min=1,max=50"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=6"`
	Name           string `json:"name" binding:"required"`
	Role           string `json:"role" binding:"required,oneof=admin purchase_admin supply_chain_manager general_manager employee"`
	CompanyCode    string `json:"company_code"`
	CostCenter     string `json:"cost_center"`
	Department     string `json:"department"`
}

type UpdateUserRequest struct {
	EmployeeNumber string `json:"employee_number" binding:"omitempty,min=1,max=50"`
	Email          string `json:"email" binding:"omitempty,email"`
	Name           string `json:"name"`
	Role           string `json:"role" binding:"omitempty,oneof=admin purchase_admin supply_chain_manager general_manager employee"`
	CompanyCode    string `json:"company_code"`
	CostCenter     string `json:"cost_center"`
	Department     string `json:"department"`
	Status         string `json:"status" binding:"omitempty,oneof=pending approved rejected disabled"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

type ApproveUserRequest struct {
	Role        string `json:"role" binding:"required,oneof=admin purchase_admin supply_chain_manager general_manager employee"`
	CompanyCode string `json:"company_code"`
	CostCenter  string `json:"cost_center"`
	Department  string `json:"department"`
}

type RejectUserRequest struct {
	Reason string `json:"reason" binding:"required,min=1,max=500"`
}

type PendingUserResponse struct {
	ID             uint      `json:"id"`
	EmployeeNumber string    `json:"employee_number"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

// ListUsers returns a list of all users
func (h *UserHandler) ListUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	search := c.Query("search")
	role := c.Query("role")
	status := c.Query("status")

	offset := (page - 1) * perPage

	query := h.db.Model(&models.User{})

	if search != "" {
		query = query.Where("name LIKE ? OR email LIKE ? OR employee_number LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if role != "" {
		query = query.Where("role = ?", role)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&users).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch users")
		return
	}

	userResponses := make([]UserResponse, len(users))
	for i, user := range users {
		userResponses[i] = UserResponse{
			ID:             user.ID,
			EmployeeNumber: user.EmployeeNumber,
			Email:          user.Email,
			Name:           user.Name,
			Role:           string(user.Role),
			CompanyCode:    user.CompanyCode,
			CostCenter:     user.CostCenter,
			Department:     user.Department,
			Status:         string(user.Status),
		}
	}

	response.SuccessWithMeta(c, userResponses, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: response.CalculateTotalPages(total, perPage),
	})
}

// GetUser returns a single user
func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	response.Success(c, UserResponse{
		ID:             user.ID,
		EmployeeNumber: user.EmployeeNumber,
		Email:          user.Email,
		Name:           user.Name,
		Role:           string(user.Role),
		CompanyCode:    user.CompanyCode,
		CostCenter:     user.CostCenter,
		Department:     user.Department,
		Status:         string(user.Status),
	})
}

// CreateUser creates a new user (admin creates as approved)
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Check if employee number already exists
	var existingUser models.User
	if err := h.db.Where("employee_number = ?", req.EmployeeNumber).First(&existingUser).Error; err == nil {
		response.Conflict(c, "Employee number already exists")
		return
	}

	// Check if email already exists
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		response.Conflict(c, "Email already exists")
		return
	}

	// Hash password
	hashedPassword, err := services.HashPassword(req.Password)
	if err != nil {
		response.InternalServerError(c, "Failed to hash password")
		return
	}

	// Get current admin user ID for approval tracking
	adminID := middleware.GetUserID(c)
	now := time.Now()

	user := models.User{
		EmployeeNumber: req.EmployeeNumber,
		Email:          req.Email,
		PasswordHash:   hashedPassword,
		Name:           req.Name,
		Role:           models.UserRole(req.Role),
		CompanyCode:    req.CompanyCode,
		CostCenter:     req.CostCenter,
		Department:     req.Department,
		Status:         models.UserStatusApproved, // Admin-created users are pre-approved
		ApprovedByID:   &adminID,
		ApprovedAt:     &now,
	}

	if err := h.db.Create(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to create user")
		return
	}

	response.Created(c, UserResponse{
		ID:             user.ID,
		EmployeeNumber: user.EmployeeNumber,
		Email:          user.Email,
		Name:           user.Name,
		Role:           string(user.Role),
		CompanyCode:    user.CompanyCode,
		CostCenter:     user.CostCenter,
		Department:     user.Department,
		Status:         string(user.Status),
	})
}

// UpdateUser updates an existing user
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Check if employee number already exists (if being changed)
	if req.EmployeeNumber != "" && req.EmployeeNumber != user.EmployeeNumber {
		var existingUser models.User
		if err := h.db.Where("employee_number = ?", req.EmployeeNumber).First(&existingUser).Error; err == nil {
			response.Conflict(c, "Employee number already exists")
			return
		}
		user.EmployeeNumber = req.EmployeeNumber
	}

	// Check if email already exists (if being changed)
	if req.Email != "" && req.Email != user.Email {
		var existingUser models.User
		if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
			response.Conflict(c, "Email already exists")
			return
		}
		user.Email = req.Email
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Role != "" {
		user.Role = models.UserRole(req.Role)
	}
	if req.CompanyCode != "" {
		user.CompanyCode = req.CompanyCode
	}
	if req.CostCenter != "" {
		user.CostCenter = req.CostCenter
	}
	if req.Department != "" {
		user.Department = req.Department
	}
	if req.Status != "" {
		user.Status = models.UserStatus(req.Status)
	}

	if err := h.db.Save(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to update user")
		return
	}

	response.Success(c, UserResponse{
		ID:             user.ID,
		EmployeeNumber: user.EmployeeNumber,
		Email:          user.Email,
		Name:           user.Name,
		Role:           string(user.Role),
		CompanyCode:    user.CompanyCode,
		CostCenter:     user.CostCenter,
		Department:     user.Department,
		Status:         string(user.Status),
	})
}

// DeleteUser deletes a user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	// Prevent self-deletion
	currentUserID := middleware.GetUserID(c)
	if uint(id) == currentUserID {
		response.BadRequest(c, "Cannot delete your own account")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	if err := h.db.Delete(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to delete user")
		return
	}

	response.SuccessWithMessage(c, "User deleted successfully", nil)
}

// ToggleUserStatus toggles user approved/disabled status
func (h *UserHandler) ToggleUserStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	// Prevent self-deactivation
	currentUserID := middleware.GetUserID(c)
	if uint(id) == currentUserID {
		response.BadRequest(c, "Cannot change your own status")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	// Toggle between approved and disabled
	if user.Status == models.UserStatusApproved {
		user.Status = models.UserStatusDisabled
	} else {
		user.Status = models.UserStatusApproved
	}

	if err := h.db.Save(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to update user status")
		return
	}

	response.SuccessWithMessage(c, "User status updated", UserResponse{
		ID:             user.ID,
		EmployeeNumber: user.EmployeeNumber,
		Email:          user.Email,
		Name:           user.Name,
		Role:           string(user.Role),
		CompanyCode:    user.CompanyCode,
		CostCenter:     user.CostCenter,
		Department:     user.Department,
		Status:         string(user.Status),
	})
}

// ChangePassword changes the user's password
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		response.NotFound(c, "User not found")
		return
	}

	// Verify current password
	if !services.VerifyPassword(req.CurrentPassword, user.PasswordHash) {
		response.Unauthorized(c, "Current password is incorrect")
		return
	}

	// Hash new password
	hashedPassword, err := services.HashPassword(req.NewPassword)
	if err != nil {
		response.InternalServerError(c, "Failed to hash password")
		return
	}

	user.PasswordHash = hashedPassword
	if err := h.db.Save(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to update password")
		return
	}

	response.SuccessWithMessage(c, "Password changed successfully", nil)
}

// ListPendingUsers returns a list of users with pending status
func (h *UserHandler) ListPendingUsers(c *gin.Context) {
	var users []models.User
	if err := h.db.Where("status = ?", models.UserStatusPending).Order("created_at ASC").Find(&users).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch pending users")
		return
	}

	pendingUsers := make([]PendingUserResponse, len(users))
	for i, user := range users {
		pendingUsers[i] = PendingUserResponse{
			ID:             user.ID,
			EmployeeNumber: user.EmployeeNumber,
			Email:          user.Email,
			Name:           user.Name,
			Status:         string(user.Status),
			CreatedAt:      user.CreatedAt,
		}
	}

	response.Success(c, pendingUsers)
}

// GetPendingUsersCount returns count of pending users for badge
func (h *UserHandler) GetPendingUsersCount(c *gin.Context) {
	var count int64
	if err := h.db.Model(&models.User{}).Where("status = ?", models.UserStatusPending).Count(&count).Error; err != nil {
		response.InternalServerError(c, "Failed to count pending users")
		return
	}

	response.Success(c, map[string]int64{"count": count})
}

// ApproveUser approves a pending user registration
func (h *UserHandler) ApproveUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	// Check if user is in pending status
	if user.Status != models.UserStatusPending {
		response.BadRequest(c, "User is not pending approval")
		return
	}

	var req ApproveUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Update user status and role
	adminID := middleware.GetUserID(c)
	now := time.Now()

	user.Status = models.UserStatusApproved
	user.Role = models.UserRole(req.Role)
	user.ApprovedByID = &adminID
	user.ApprovedAt = &now

	// Set optional fields if provided
	if req.CompanyCode != "" {
		user.CompanyCode = req.CompanyCode
	}
	if req.CostCenter != "" {
		user.CostCenter = req.CostCenter
	}
	if req.Department != "" {
		user.Department = req.Department
	}

	if err := h.db.Save(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to approve user")
		return
	}

	response.SuccessWithMessage(c, "User approved successfully", UserResponse{
		ID:             user.ID,
		EmployeeNumber: user.EmployeeNumber,
		Email:          user.Email,
		Name:           user.Name,
		Role:           string(user.Role),
		CompanyCode:    user.CompanyCode,
		CostCenter:     user.CostCenter,
		Department:     user.Department,
		Status:         string(user.Status),
	})
}

// RejectUser rejects a pending user registration
func (h *UserHandler) RejectUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "User not found")
		} else {
			response.InternalServerError(c, "Failed to fetch user")
		}
		return
	}

	// Check if user is in pending status
	if user.Status != models.UserStatusPending {
		response.BadRequest(c, "User is not pending approval")
		return
	}

	var req RejectUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Update user status
	user.Status = models.UserStatusRejected
	user.RejectionReason = req.Reason

	if err := h.db.Save(&user).Error; err != nil {
		response.InternalServerError(c, "Failed to reject user")
		return
	}

	response.SuccessWithMessage(c, "User registration rejected", UserResponse{
		ID:             user.ID,
		EmployeeNumber: user.EmployeeNumber,
		Email:          user.Email,
		Name:           user.Name,
		Role:           string(user.Role),
		CompanyCode:    user.CompanyCode,
		CostCenter:     user.CostCenter,
		Department:     user.Department,
		Status:         string(user.Status),
	})
}

// BulkImportUser represents a single user in bulk import
type BulkImportUser struct {
	EmployeeNumber string `json:"employee_number" binding:"required"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=6"`
	Name           string `json:"name" binding:"required"`
	Role           string `json:"role" binding:"required,oneof=admin purchase_admin supply_chain_manager general_manager employee"`
	CompanyCode    string `json:"company_code"`
	CostCenter     string `json:"cost_center"`
	Department     string `json:"department"`
}

// BulkImportRequest is the request body for bulk user import
type BulkImportRequest struct {
	Users []BulkImportUser `json:"users" binding:"required,min=1"`
}

// BulkImportResult represents the result of a single user import
type BulkImportResult struct {
	EmployeeNumber string `json:"employee_number"`
	Email          string `json:"email"`
	Success        bool   `json:"success"`
	Error          string `json:"error,omitempty"`
}

// BulkImportUsers imports multiple users at once
func (h *UserHandler) BulkImportUsers(c *gin.Context) {
	var req BulkImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	adminID := middleware.GetUserID(c)
	now := time.Now()

	results := make([]BulkImportResult, len(req.Users))
	successCount := 0

	for i, u := range req.Users {
		result := BulkImportResult{
			EmployeeNumber: u.EmployeeNumber,
			Email:          u.Email,
		}

		// Check if employee number already exists
		var existingUser models.User
		if err := h.db.Where("employee_number = ?", u.EmployeeNumber).First(&existingUser).Error; err == nil {
			result.Error = "Employee number already exists"
			results[i] = result
			continue
		}

		// Check if email already exists
		if err := h.db.Where("email = ?", u.Email).First(&existingUser).Error; err == nil {
			result.Error = "Email already exists"
			results[i] = result
			continue
		}

		// Hash password
		hashedPassword, err := services.HashPassword(u.Password)
		if err != nil {
			result.Error = "Failed to hash password"
			results[i] = result
			continue
		}

		user := models.User{
			EmployeeNumber: u.EmployeeNumber,
			Email:          u.Email,
			PasswordHash:   hashedPassword,
			Name:           u.Name,
			Role:           models.UserRole(u.Role),
			CompanyCode:    u.CompanyCode,
			CostCenter:     u.CostCenter,
			Department:     u.Department,
			Status:         models.UserStatusApproved,
			ApprovedByID:   &adminID,
			ApprovedAt:     &now,
		}

		if err := h.db.Create(&user).Error; err != nil {
			result.Error = "Failed to create user: " + err.Error()
			results[i] = result
			continue
		}

		result.Success = true
		results[i] = result
		successCount++
	}

	response.SuccessWithMessage(c, "Bulk import completed", map[string]interface{}{
		"total":    len(req.Users),
		"success":  successCount,
		"failed":   len(req.Users) - successCount,
		"results":  results,
	})
}
