package models

import (
	"time"
)

// CartItem represents an item in a user's shopping cart
type CartItem struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	UserID uint `gorm:"index" json:"user_id"`

	// Product info (either from URL extraction or catalog)
	URL              string  `gorm:"size:2000" json:"url"`
	ProductTitle     string  `gorm:"size:500" json:"product_title"`
	ProductImageURL  string  `gorm:"size:2000" json:"product_image_url"`
	ProductDescription string `gorm:"type:text" json:"product_description"`
	EstimatedPrice   float64 `gorm:"type:decimal(12,2)" json:"estimated_price"`
	Currency         string  `gorm:"size:10;default:MXN" json:"currency"`

	// Quantity
	Quantity int `gorm:"default:1" json:"quantity"`

	// Source info
	Source      string `gorm:"size:20;default:external" json:"source"` // external, catalog
	CatalogProductID *uint `json:"catalog_product_id,omitempty"`

	// Amazon info
	IsAmazonURL bool   `gorm:"default:false" json:"is_amazon_url"`
	AmazonASIN  string `gorm:"size:20" json:"amazon_asin,omitempty"`

	// Metadata
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// CartItemResponse is the API response for a cart item
type CartItemResponse struct {
	ID                 uint    `json:"id"`
	URL                string  `json:"url"`
	ProductTitle       string  `json:"product_title"`
	ProductImageURL    string  `json:"product_image_url"`
	ProductDescription string  `json:"product_description"`
	EstimatedPrice     float64 `json:"estimated_price"`
	Currency           string  `json:"currency"`
	Quantity           int     `json:"quantity"`
	Subtotal           float64 `json:"subtotal"`
	Source             string  `json:"source"`
	CatalogProductID   *uint   `json:"catalog_product_id,omitempty"`
	IsAmazonURL        bool    `json:"is_amazon_url"`
	AmazonASIN         string  `json:"amazon_asin,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

// ToResponse converts CartItem to CartItemResponse
func (c *CartItem) ToResponse() CartItemResponse {
	return CartItemResponse{
		ID:                 c.ID,
		URL:                c.URL,
		ProductTitle:       c.ProductTitle,
		ProductImageURL:    c.ProductImageURL,
		ProductDescription: c.ProductDescription,
		EstimatedPrice:     c.EstimatedPrice,
		Currency:           c.Currency,
		Quantity:           c.Quantity,
		Subtotal:           c.EstimatedPrice * float64(c.Quantity),
		Source:             c.Source,
		CatalogProductID:   c.CatalogProductID,
		IsAmazonURL:        c.IsAmazonURL,
		AmazonASIN:         c.AmazonASIN,
		CreatedAt:          c.CreatedAt,
	}
}

// CartSummary represents the cart summary
type CartSummary struct {
	Items      []CartItemResponse `json:"items"`
	ItemCount  int                `json:"item_count"`
	TotalItems int                `json:"total_items"` // Sum of all quantities
	Total      float64            `json:"total"`
	Currency   string             `json:"currency"`
}
