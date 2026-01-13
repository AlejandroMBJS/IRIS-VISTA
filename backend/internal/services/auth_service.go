package services

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"vista-backend/internal/models"
	"vista-backend/pkg/jwt"
)

var (
	ErrInvalidCredentials   = errors.New("invalid email or password")
	ErrUserNotFound         = errors.New("user not found")
	ErrUserPending          = errors.New("user account is pending approval")
	ErrUserRejected         = errors.New("user registration was rejected")
	ErrUserDisabled         = errors.New("user account is disabled")
	ErrEmployeeNumberExists = errors.New("employee number already exists")
	ErrEmailExists          = errors.New("email already exists")
)

type AuthService struct {
	db         *gorm.DB
	jwtService *jwt.JWTService
}

func NewAuthService(db *gorm.DB, jwtService *jwt.JWTService) *AuthService {
	return &AuthService{
		db:         db,
		jwtService: jwtService,
	}
}

// Login authenticates a user by email and returns tokens
func (as *AuthService) Login(email, password string) (*jwt.TokenPair, *models.User, error) {
	var user models.User
	if err := as.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, err
	}

	// Check user status
	switch user.Status {
	case models.UserStatusPending:
		return nil, nil, ErrUserPending
	case models.UserStatusRejected:
		return nil, nil, ErrUserRejected
	case models.UserStatusDisabled:
		return nil, nil, ErrUserDisabled
	case models.UserStatusApproved:
		// OK, continue with login
	default:
		return nil, nil, ErrUserDisabled
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, nil, ErrInvalidCredentials
	}

	// Generate tokens
	tokens, err := as.jwtService.GenerateTokenPair(user.ID, user.EmployeeNumber, string(user.Role))
	if err != nil {
		return nil, nil, err
	}

	return tokens, &user, nil
}

// Register creates a new user with pending status
func (as *AuthService) Register(employeeNumber, name, email, password string) (*models.User, error) {
	// Check if employee number already exists
	var existingUser models.User
	if err := as.db.Where("employee_number = ?", employeeNumber).First(&existingUser).Error; err == nil {
		return nil, ErrEmployeeNumberExists
	}

	// Check if email already exists
	if err := as.db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return nil, ErrEmailExists
	}

	// Hash password
	hashedPassword, err := HashPassword(password)
	if err != nil {
		return nil, err
	}

	// Create user with pending status
	user := models.User{
		EmployeeNumber: employeeNumber,
		Name:           name,
		Email:          email,
		PasswordHash:   hashedPassword,
		Role:           models.RoleEmployee, // Default role, admin will assign on approval
		Status:         models.UserStatusPending,
	}

	if err := as.db.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// RefreshTokens refreshes the access token using a valid refresh token
func (as *AuthService) RefreshTokens(refreshToken string) (*jwt.TokenPair, error) {
	claims, err := as.jwtService.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Verify user still exists and is approved
	var user models.User
	if err := as.db.First(&user, claims.UserID).Error; err != nil {
		return nil, ErrUserNotFound
	}

	if !user.CanLogin() {
		return nil, ErrUserDisabled
	}

	// Generate new tokens
	return as.jwtService.GenerateTokenPair(user.ID, user.EmployeeNumber, string(user.Role))
}

// GetUserByID retrieves a user by ID
func (as *AuthService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	if err := as.db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes), err
}

// VerifyPassword verifies a password against a hash
func VerifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
