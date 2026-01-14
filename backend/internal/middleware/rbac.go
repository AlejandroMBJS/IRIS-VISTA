package middleware

import (
	"github.com/gin-gonic/gin"
	"vista-backend/internal/models"
	"vista-backend/pkg/response"
)

// RequireRole returns middleware that requires specific roles
func RequireRole(allowedRoles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := GetUserRole(c)
		if userRole == "" {
			response.Unauthorized(c, "Authentication required")
			c.Abort()
			return
		}

		// Check if user's role is in allowed roles
		for _, role := range allowedRoles {
			if models.UserRole(userRole) == role {
				c.Next()
				return
			}
		}

		response.Forbidden(c, "Insufficient permissions")
		c.Abort()
	}
}

// RequireAdmin requires admin role
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

// RequireAdminOrSupplyChain requires admin or supply chain manager role
func RequireAdminOrSupplyChain() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleSupplyChainManager)
}

// RequireInventoryAccess requires admin, purchase_admin, or supply chain manager role
func RequireInventoryAccess() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RolePurchaseAdmin, models.RoleSupplyChainManager)
}

// RequireApprover requires a role that can approve/reject requests
// Only General Manager can approve - Admin cannot approve, only view
func RequireApprover() gin.HandlerFunc {
	return RequireRole(models.RoleGeneralManager)
}

// RequireCanViewApprovals requires a role that can view all approvals
// GM can approve/reject, Admin and Purchase Admin can only view
func RequireCanViewApprovals() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleGeneralManager, models.RolePurchaseAdmin)
}

// RequireManager requires a manager-level role
func RequireManager() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RoleSupplyChainManager, models.RoleGeneralManager)
}

// RequirePurchaseManager requires a role that can manage approved orders
func RequirePurchaseManager() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RolePurchaseAdmin)
}

// RequirePurchaseConfig requires a role that can configure the purchase module
func RequirePurchaseConfig() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin, models.RolePurchaseAdmin)
}

// CanViewAllRequests checks if user can view all requests
func CanViewAllRequests() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := GetUserRole(c)
		if userRole == "" {
			response.Unauthorized(c, "Authentication required")
			c.Abort()
			return
		}

		role := models.UserRole(userRole)
		if role == models.RoleAdmin || role == models.RoleSupplyChainManager || role == models.RoleGeneralManager || role == models.RolePurchaseAdmin {
			c.Set("can_view_all", true)
		} else {
			c.Set("can_view_all", false)
		}

		c.Next()
	}
}

// CanViewAll extracts the can_view_all flag from context
func CanViewAll(c *gin.Context) bool {
	if canView, exists := c.Get("can_view_all"); exists {
		return canView.(bool)
	}
	return false
}
