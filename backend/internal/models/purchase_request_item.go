package models

import (
	"time"
)

// PurchaseRequestItem represents a single product within a multi-product purchase request
type PurchaseRequestItem struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	RequestID uint   `gorm:"not null;index" json:"request_id"`

	// Product information (extracted from URL)
	URL                string   `gorm:"not null;size:2000" json:"url"`
	ProductTitle       string   `gorm:"size:500" json:"product_title"`
	ProductImageURL    string   `gorm:"size:2000" json:"product_image_url"`
	ProductDescription string   `gorm:"type:text" json:"product_description"`
	EstimatedPrice     *float64 `json:"estimated_price,omitempty"`
	Currency           string   `gorm:"default:'MXN';size:10" json:"currency"`

	// Quantity for this specific product
	Quantity int `gorm:"not null;default:1" json:"quantity"`

	// Amazon automation status (per item)
	IsAmazonURL   bool   `gorm:"default:false" json:"is_amazon_url"`
	AmazonASIN    string `gorm:"size:20" json:"amazon_asin,omitempty"`
	AddedToCart   bool   `gorm:"default:false" json:"added_to_cart"`
	AddedToCartAt *time.Time `json:"added_to_cart_at,omitempty"`
	CartError     string `gorm:"type:text" json:"cart_error,omitempty"`

	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Subtotal calculates the subtotal for this item (price * quantity)
func (item *PurchaseRequestItem) Subtotal() float64 {
	if item.EstimatedPrice == nil {
		return 0
	}
	return *item.EstimatedPrice * float64(item.Quantity)
}

// HasPrice checks if the item has a price
func (item *PurchaseRequestItem) HasPrice() bool {
	return item.EstimatedPrice != nil && *item.EstimatedPrice > 0
}
