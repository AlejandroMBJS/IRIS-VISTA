package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services"
	"vista-backend/pkg/response"
)

type AuthHandler struct {
	authService *services.AuthService
	db          *gorm.DB
}

func NewAuthHandler(authService *services.AuthService, db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		db:          db,
	}
}

// logActivity logs an authentication activity
func (h *AuthHandler) logActivity(c *gin.Context, activityType models.ActivityType, userID *uint, identifier string, success bool, details string) {
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	log := models.NewActivityLog(activityType, userID, identifier, ipAddress, userAgent).
		WithSuccess(success).
		WithDetails(details)

	// For login, set session expiry (24 hours by default)
	if activityType == models.ActivityLogin && success {
		expiresAt := time.Now().Add(24 * time.Hour)
		log.WithSession("", expiresAt)
	}

	h.db.Create(log)
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int64        `json:"expires_in"`
}

type RegisterRequest struct {
	EmployeeNumber string `json:"employee_number" binding:"required,min=1,max=50"`
	Name           string `json:"name" binding:"required,min=2,max=255"`
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required,min=8"`
}

type RegisterResponse struct {
	Message        string `json:"message"`
	EmployeeNumber string `json:"employee_number"`
	Name           string `json:"name"`
	Email          string `json:"email"`
	Status         string `json:"status"`
}

type UserResponse struct {
	ID             uint   `json:"id"`
	EmployeeNumber string `json:"employee_number"`
	Email          string `json:"email"`
	Name           string `json:"name"`
	Role           string `json:"role"`
	CompanyCode    string `json:"company_code"`
	CostCenter     string `json:"cost_center"`
	Department     string `json:"department"`
	Status         string `json:"status"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type RefreshResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// Login handles user login with email
// @Summary User login
// @Description Authenticates a user with email and returns JWT tokens
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Failure 403 {object} response.Response
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	tokens, user, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		// Log failed login attempt
		var details string
		switch err {
		case services.ErrInvalidCredentials:
			details = "Invalid credentials"
			h.logActivity(c, models.ActivityLoginFailed, nil, req.Email, false, details)
			response.Unauthorized(c, "Invalid email or password")
		case services.ErrUserPending:
			details = "Account pending approval"
			h.logActivity(c, models.ActivityLoginFailed, nil, req.Email, false, details)
			c.JSON(403, gin.H{
				"success": false,
				"error":   "Account pending approval",
				"code":    "PENDING_APPROVAL",
				"message": "Your account is awaiting admin approval. Please wait for confirmation.",
			})
		case services.ErrUserRejected:
			details = "Account rejected"
			h.logActivity(c, models.ActivityLoginFailed, nil, req.Email, false, details)
			c.JSON(403, gin.H{
				"success": false,
				"error":   "Account registration rejected",
				"code":    "REJECTED",
				"message": "Your registration was rejected. Please contact the administrator.",
			})
		case services.ErrUserDisabled:
			details = "Account disabled"
			h.logActivity(c, models.ActivityLoginFailed, nil, req.Email, false, details)
			c.JSON(403, gin.H{
				"success": false,
				"error":   "Account disabled",
				"code":    "DISABLED",
				"message": "Your account has been disabled. Please contact the administrator.",
			})
		default:
			h.logActivity(c, models.ActivityLoginFailed, nil, req.Email, false, err.Error())
			response.InternalServerError(c, "Login failed")
		}
		return
	}

	// Log successful login
	h.logActivity(c, models.ActivityLogin, &user.ID, req.Email, true, "")

	response.Success(c, LoginResponse{
		User: UserResponse{
			ID:             user.ID,
			EmployeeNumber: user.EmployeeNumber,
			Email:          user.Email,
			Name:           user.Name,
			Role:           string(user.Role),
			CompanyCode:    user.CompanyCode,
			CostCenter:     user.CostCenter,
			Department:     user.Department,
			Status:         string(user.Status),
		},
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    tokens.ExpiresIn,
	})
}

// Register handles new user registration
// @Summary User registration
// @Description Registers a new user (pending admin approval)
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RegisterRequest true "Registration details"
// @Success 201 {object} RegisterResponse
// @Failure 400 {object} response.Response
// @Failure 409 {object} response.Response
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	user, err := h.authService.Register(req.EmployeeNumber, req.Name, req.Email, req.Password)
	if err != nil {
		switch err {
		case services.ErrEmployeeNumberExists:
			c.JSON(409, gin.H{
				"success": false,
				"error":   "Employee number already registered",
				"field":   "employee_number",
			})
		case services.ErrEmailExists:
			c.JSON(409, gin.H{
				"success": false,
				"error":   "Email already registered",
				"field":   "email",
			})
		default:
			response.InternalServerError(c, "Registration failed")
		}
		return
	}

	// Log registration
	h.logActivity(c, models.ActivityRegistration, &user.ID, req.EmployeeNumber, true, "New user registered")

	response.Created(c, RegisterResponse{
		Message:        "Registration successful. Please wait for admin approval.",
		EmployeeNumber: user.EmployeeNumber,
		Name:           user.Name,
		Email:          user.Email,
		Status:         string(user.Status),
	})
}

// Logout handles user logout
// @Summary User logout
// @Description Logs out the current user
// @Tags Auth
// @Security BearerAuth
// @Success 200 {object} response.Response
// @Router /api/v1/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a stateless JWT system, logout is handled client-side by removing tokens
	// For additional security, you could implement a token blacklist here
	response.SuccessWithMessage(c, "Logged out successfully", nil)
}

// Refresh refreshes the access token
// @Summary Refresh access token
// @Description Refreshes the access token using a valid refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body RefreshRequest true "Refresh token"
// @Success 200 {object} RefreshResponse
// @Failure 400 {object} response.Response
// @Failure 401 {object} response.Response
// @Router /api/v1/auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	tokens, err := h.authService.RefreshTokens(req.RefreshToken)
	if err != nil {
		response.Unauthorized(c, "Invalid or expired refresh token")
		return
	}

	response.Success(c, RefreshResponse{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		ExpiresIn:    tokens.ExpiresIn,
	})
}

// Me returns the current user's information
// @Summary Get current user
// @Description Returns the authenticated user's information
// @Tags Auth
// @Security BearerAuth
// @Success 200 {object} UserResponse
// @Failure 401 {object} response.Response
// @Router /api/v1/auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "Authentication required")
		return
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		response.NotFound(c, "User not found")
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
