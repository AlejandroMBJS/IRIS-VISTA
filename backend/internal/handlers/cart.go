package handlers

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services/metadata"
	"vista-backend/pkg/response"
)

type CartHandler struct {
	db          *gorm.DB
	metadataSvc *metadata.Service
}

func NewCartHandler(db *gorm.DB, metadataSvc *metadata.Service) *CartHandler {
	return &CartHandler{
		db:          db,
		metadataSvc: metadataSvc,
	}
}

// AddToCartRequest represents the request body for adding item to cart
type AddToCartRequest struct {
	URL              string  `json:"url"`
	ProductTitle     string  `json:"product_title"`
	ProductImageURL  string  `json:"product_image_url"`
	ProductDescription string `json:"product_description"`
	EstimatedPrice   float64 `json:"estimated_price"`
	Currency         string  `json:"currency"`
	Quantity         int     `json:"quantity"`
	Source           string  `json:"source"` // external, catalog
	CatalogProductID *uint   `json:"catalog_product_id,omitempty"`
}

// UpdateCartItemRequest represents the request body for updating a cart item
type UpdateCartItemRequest struct {
	Quantity         *int     `json:"quantity"`
	ProductTitle     *string  `json:"product_title"`
	ProductImageURL  *string  `json:"product_image_url"`
	ProductDescription *string `json:"product_description"`
	EstimatedPrice   *float64 `json:"estimated_price"`
}

// GetCart returns the current user's cart
func (h *CartHandler) GetCart(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var items []models.CartItem
	if err := h.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&items).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch cart")
		return
	}

	// Build response
	cartItems := make([]models.CartItemResponse, len(items))
	var total float64
	var totalItems int
	currency := "MXN"

	for i, item := range items {
		cartItems[i] = item.ToResponse()
		total += item.EstimatedPrice * float64(item.Quantity)
		totalItems += item.Quantity
		if item.Currency != "" {
			currency = item.Currency
		}
	}

	response.Success(c, models.CartSummary{
		Items:      cartItems,
		ItemCount:  len(items),
		TotalItems: totalItems,
		Total:      total,
		Currency:   currency,
	})
}

// GetCartCount returns just the cart count for the navbar badge
func (h *CartHandler) GetCartCount(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var count int64
	if err := h.db.Model(&models.CartItem{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch cart count")
		return
	}

	response.Success(c, gin.H{"count": count})
}

// AddToCart adds an item to the cart
func (h *CartHandler) AddToCart(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Set defaults
	if req.Quantity <= 0 {
		req.Quantity = 1
	}
	if req.Source == "" {
		req.Source = "external"
	}
	if req.Currency == "" {
		req.Currency = "MXN"
	}

	// Check for Amazon URL
	isAmazon := strings.Contains(strings.ToLower(req.URL), "amazon")
	amazonASIN := ""
	if isAmazon {
		amazonASIN = extractASIN(req.URL)
	}

	// Check if similar item already exists in cart
	var existingItem models.CartItem
	query := h.db.Where("user_id = ? AND url = ?", userID, req.URL)

	if err := query.First(&existingItem).Error; err == nil {
		// Item exists, update quantity
		existingItem.Quantity += req.Quantity
		if err := h.db.Save(&existingItem).Error; err != nil {
			response.InternalServerError(c, "Failed to update cart")
			return
		}
		response.Success(c, existingItem.ToResponse())
		return
	}

	// Create new cart item
	item := models.CartItem{
		UserID:             userID,
		URL:                req.URL,
		ProductTitle:       req.ProductTitle,
		ProductImageURL:    req.ProductImageURL,
		ProductDescription: req.ProductDescription,
		EstimatedPrice:     req.EstimatedPrice,
		Currency:           req.Currency,
		Quantity:           req.Quantity,
		Source:             req.Source,
		CatalogProductID:   req.CatalogProductID,
		IsAmazonURL:        isAmazon,
		AmazonASIN:         amazonASIN,
	}

	if err := h.db.Create(&item).Error; err != nil {
		response.InternalServerError(c, "Failed to add to cart")
		return
	}

	response.Created(c, item.ToResponse())
}

// UpdateCartItem updates a cart item
func (h *CartHandler) UpdateCartItem(c *gin.Context) {
	userID := middleware.GetUserID(c)
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid item ID")
		return
	}

	var item models.CartItem
	if err := h.db.Where("id = ? AND user_id = ?", itemID, userID).First(&item).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Cart item not found")
			return
		}
		response.InternalServerError(c, "Failed to fetch cart item")
		return
	}

	var req UpdateCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Update fields
	if req.Quantity != nil {
		if *req.Quantity <= 0 {
			// Remove item if quantity is 0 or less
			if err := h.db.Delete(&item).Error; err != nil {
				response.InternalServerError(c, "Failed to remove cart item")
				return
			}
			response.Success(c, gin.H{"message": "Item removed from cart"})
			return
		}
		item.Quantity = *req.Quantity
	}
	if req.ProductTitle != nil {
		item.ProductTitle = *req.ProductTitle
	}
	if req.ProductImageURL != nil {
		item.ProductImageURL = *req.ProductImageURL
	}
	if req.ProductDescription != nil {
		item.ProductDescription = *req.ProductDescription
	}
	if req.EstimatedPrice != nil {
		item.EstimatedPrice = *req.EstimatedPrice
	}

	if err := h.db.Save(&item).Error; err != nil {
		response.InternalServerError(c, "Failed to update cart item")
		return
	}

	response.Success(c, item.ToResponse())
}

// RemoveFromCart removes an item from the cart
func (h *CartHandler) RemoveFromCart(c *gin.Context) {
	userID := middleware.GetUserID(c)
	itemID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid item ID")
		return
	}

	result := h.db.Where("id = ? AND user_id = ?", itemID, userID).Delete(&models.CartItem{})
	if result.Error != nil {
		response.InternalServerError(c, "Failed to remove cart item")
		return
	}
	if result.RowsAffected == 0 {
		response.NotFound(c, "Cart item not found")
		return
	}

	response.Success(c, gin.H{"message": "Item removed from cart"})
}

// ClearCart removes all items from the user's cart
func (h *CartHandler) ClearCart(c *gin.Context) {
	userID := middleware.GetUserID(c)

	if err := h.db.Where("user_id = ?", userID).Delete(&models.CartItem{}).Error; err != nil {
		response.InternalServerError(c, "Failed to clear cart")
		return
	}

	response.Success(c, gin.H{"message": "Cart cleared"})
}

// extractASIN extracts the Amazon ASIN from a URL
func extractASIN(url string) string {
	// Common patterns: /dp/ASIN, /gp/product/ASIN, /ASIN/
	patterns := []string{"/dp/", "/gp/product/", "/gp/aw/d/"}
	for _, pattern := range patterns {
		if idx := strings.Index(url, pattern); idx != -1 {
			start := idx + len(pattern)
			end := start
			for end < len(url) && end-start < 10 {
				ch := url[end]
				if ch == '/' || ch == '?' || ch == '&' {
					break
				}
				end++
			}
			if end > start {
				return url[start:end]
			}
		}
	}
	return ""
}
