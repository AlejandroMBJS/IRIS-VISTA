package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin              UserRole = "admin"
	RolePurchaseAdmin      UserRole = "purchase_admin"
	RoleSupplyChainManager UserRole = "supply_chain_manager"
	RoleGeneralManager     UserRole = "general_manager"
	RoleEmployee           UserRole = "employee"
)

// UserStatus represents the status of a user account
type UserStatus string

const (
	UserStatusPending  UserStatus = "pending"  // Awaiting admin approval
	UserStatusApproved UserStatus = "approved" // Approved and can login
	UserStatusRejected UserStatus = "rejected" // Registration rejected
	UserStatusDisabled UserStatus = "disabled" // Account disabled by admin
)

type User struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	EmployeeNumber string         `gorm:"uniqueIndex;not null;size:50" json:"employee_number"` // Used for login
	Email          string         `gorm:"uniqueIndex;not null;size:255" json:"email"`          // For notifications
	PasswordHash   string         `gorm:"not null" json:"-"`
	Name           string         `gorm:"not null;size:255" json:"name"`
	Role           UserRole       `gorm:"size:50;default:'employee'" json:"role"`
	CompanyCode    string         `gorm:"size:50" json:"company_code"`
	CostCenter     string         `gorm:"size:50" json:"cost_center"`
	Department     string         `gorm:"size:100" json:"department"`
	Status         UserStatus     `gorm:"default:'pending';size:20" json:"status"` // pending, approved, rejected, disabled

	// Approval tracking
	ApprovedByID    *uint      `json:"approved_by_id,omitempty"`
	ApprovedBy      *User      `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
	RejectionReason string     `gorm:"size:500" json:"rejection_reason,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// IsApproved returns true if user account is approved and can login
func (u *User) IsApproved() bool {
	return u.Status == UserStatusApproved
}

// IsPending returns true if user is awaiting approval
func (u *User) IsPending() bool {
	return u.Status == UserStatusPending
}

// IsRejected returns true if user registration was rejected
func (u *User) IsRejected() bool {
	return u.Status == UserStatusRejected
}

// IsDisabled returns true if user account is disabled
func (u *User) IsDisabled() bool {
	return u.Status == UserStatusDisabled
}

// CanLogin returns true if user can login (approved status)
func (u *User) CanLogin() bool {
	return u.Status == UserStatusApproved
}

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

func (u *User) IsGeneralManager() bool {
	return u.Role == RoleGeneralManager
}

func (u *User) IsSupplyChainManager() bool {
	return u.Role == RoleSupplyChainManager
}

func (u *User) IsPurchaseAdmin() bool {
	return u.Role == RolePurchaseAdmin
}

// CanApprove returns true if user can approve/reject purchase requests
// Only General Manager can approve - Admin can view but not approve
func (u *User) CanApprove() bool {
	return u.Role == RoleGeneralManager
}

// CanViewApprovals returns true if user can view all approvals (admin, purchase_admin, GM)
func (u *User) CanViewApprovals() bool {
	return u.Role == RoleGeneralManager || u.Role == RoleAdmin || u.Role == RolePurchaseAdmin
}

func (u *User) CanManageUsers() bool {
	return u.Role == RoleAdmin
}

// CanManagePurchases returns true if user can manage approved orders
// (mark as purchased, add notes, export)
func (u *User) CanManagePurchases() bool {
	return u.Role == RoleAdmin || u.Role == RolePurchaseAdmin
}

// CanConfigurePurchases returns true if user can configure the purchase module
func (u *User) CanConfigurePurchases() bool {
	return u.Role == RoleAdmin || u.Role == RolePurchaseAdmin
}

func (u *User) CanConfigureAmazon() bool {
	return u.Role == RoleAdmin
}

func (u *User) CanViewAllRequests() bool {
	return u.Role == RoleAdmin || u.Role == RoleSupplyChainManager || u.Role == RoleGeneralManager || u.Role == RolePurchaseAdmin
}
