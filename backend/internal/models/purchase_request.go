package models

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

type RequestStatus string

const (
	StatusPending       RequestStatus = "pending"
	StatusApproved      RequestStatus = "approved"
	StatusRejected      RequestStatus = "rejected"
	StatusInfoRequested RequestStatus = "info_requested"
	StatusPurchased     RequestStatus = "purchased"
	StatusDelivered     RequestStatus = "delivered"
	StatusCancelled     RequestStatus = "cancelled"
)

type Urgency string

const (
	UrgencyNormal Urgency = "normal"
	UrgencyUrgent Urgency = "urgent"
)

// PurchaseRequest represents a purchase request that can contain multiple products
type PurchaseRequest struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	RequestNumber string         `gorm:"uniqueIndex;not null;size:50" json:"request_number"`

	// Legacy single-product fields (kept for backward compatibility)
	// New multi-product requests should use Items instead
	URL                string   `gorm:"size:2000" json:"url,omitempty"`
	ProductTitle       string   `gorm:"size:500" json:"product_title,omitempty"`
	ProductImageURL    string   `gorm:"size:2000" json:"product_image_url,omitempty"`
	ProductDescription string   `gorm:"type:text" json:"product_description,omitempty"`
	EstimatedPrice     *float64 `json:"estimated_price,omitempty"`
	Currency           string   `gorm:"default:'MXN';size:10" json:"currency"`
	Quantity           int      `gorm:"not null;default:1" json:"quantity"`

	// Multi-product support
	Items        []PurchaseRequestItem `gorm:"foreignKey:RequestID" json:"items,omitempty"`
	ProductCount int                   `gorm:"default:1" json:"product_count"`
	TotalEstimated *float64            `json:"total_estimated,omitempty"`

	// Request details
	Justification string  `gorm:"type:text" json:"justification"`
	Urgency       Urgency `gorm:"default:'normal';size:20" json:"urgency"`

	// Requester
	RequesterID uint `gorm:"not null;index" json:"requester_id"`
	Requester   User `gorm:"foreignKey:RequesterID" json:"requester"`

	// Status
	Status RequestStatus `gorm:"default:'pending';size:20;index" json:"status"`

	// Approval flow
	ApprovedByID    *uint      `json:"approved_by_id,omitempty"`
	ApprovedBy      *User      `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt      *time.Time `json:"approved_at,omitempty"`
	RejectedByID    *uint      `json:"rejected_by_id,omitempty"`
	RejectedBy      *User      `gorm:"foreignKey:RejectedByID" json:"rejected_by,omitempty"`
	RejectedAt      *time.Time `json:"rejected_at,omitempty"`
	RejectionReason string     `gorm:"type:text" json:"rejection_reason,omitempty"`

	// Info request (when GM needs more info)
	InfoRequestedAt *time.Time `json:"info_requested_at,omitempty"`
	InfoRequestNote string     `gorm:"type:text" json:"info_request_note,omitempty"`

	// Purchase Order number (assigned when approved)
	// Using pointer so NULL values don't violate unique constraint
	PONumber *string `gorm:"uniqueIndex;size:50" json:"po_number,omitempty"`

	// Purchase completion (when admin marks as purchased)
	PurchasedByID *uint      `json:"purchased_by_id,omitempty"`
	PurchasedBy   *User      `gorm:"foreignKey:PurchasedByID" json:"purchased_by,omitempty"`
	PurchasedAt   *time.Time `json:"purchased_at,omitempty"`
	PurchaseNotes string     `gorm:"type:text" json:"purchase_notes,omitempty"`
	OrderNumber   string     `gorm:"size:100" json:"order_number,omitempty"`

	// Delivery completion (when order is delivered)
	DeliveredByID *uint      `json:"delivered_by_id,omitempty"`
	DeliveredBy   *User      `gorm:"foreignKey:DeliveredByID" json:"delivered_by,omitempty"`
	DeliveredAt   *time.Time `json:"delivered_at,omitempty"`
	DeliveryNotes string     `gorm:"type:text" json:"delivery_notes,omitempty"`

	// Cancellation (when order is cancelled after purchase)
	CancelledByID     *uint      `json:"cancelled_by_id,omitempty"`
	CancelledBy       *User      `gorm:"foreignKey:CancelledByID" json:"cancelled_by,omitempty"`
	CancelledAt       *time.Time `json:"cancelled_at,omitempty"`
	CancellationNotes string     `gorm:"type:text" json:"cancellation_notes,omitempty"`

	// Admin notes (visible to admin, purchase_admin, gm, and requester)
	AdminNotes string `gorm:"type:text" json:"admin_notes,omitempty"`

	// Translated fields (JSON containing {original, en, zh, es})
	JustificationTranslated     JSONB `gorm:"type:jsonb" json:"justification_translated,omitempty"`
	RejectionReasonTranslated   JSONB `gorm:"type:jsonb" json:"rejection_reason_translated,omitempty"`
	InfoRequestNoteTranslated   JSONB `gorm:"type:jsonb" json:"info_request_note_translated,omitempty"`
	PurchaseNotesTranslated     JSONB `gorm:"type:jsonb" json:"purchase_notes_translated,omitempty"`
	DeliveryNotesTranslated     JSONB `gorm:"type:jsonb" json:"delivery_notes_translated,omitempty"`
	CancellationNotesTranslated JSONB `gorm:"type:jsonb" json:"cancellation_notes_translated,omitempty"`
	AdminNotesTranslated        JSONB `gorm:"type:jsonb" json:"admin_notes_translated,omitempty"`

	// Amazon automation status (legacy single-product)
	IsAmazonURL       bool       `gorm:"default:false" json:"is_amazon_url"`
	AddedToCart       bool       `gorm:"default:false" json:"added_to_cart"`
	AddedToCartAt     *time.Time `json:"added_to_cart_at,omitempty"`
	CartError         string     `gorm:"type:text" json:"cart_error,omitempty"`
	AmazonASIN        string     `gorm:"size:20" json:"amazon_asin,omitempty"`

	// History
	History []RequestHistory `gorm:"foreignKey:RequestID" json:"history,omitempty"`

	// Timestamps
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// CalculateTotals calculates product count and total estimated price from items
func (pr *PurchaseRequest) CalculateTotals() {
	if len(pr.Items) > 0 {
		pr.ProductCount = len(pr.Items)
		var total float64
		for _, item := range pr.Items {
			total += item.Subtotal()
		}
		if total > 0 {
			pr.TotalEstimated = &total
		}
	} else if pr.URL != "" {
		// Legacy single-product request
		pr.ProductCount = 1
		if pr.EstimatedPrice != nil {
			total := *pr.EstimatedPrice * float64(pr.Quantity)
			pr.TotalEstimated = &total
		}
	}
}

// IsMultiProduct checks if this is a multi-product request
func (pr *PurchaseRequest) IsMultiProduct() bool {
	return len(pr.Items) > 0
}

// HasAmazonItems checks if any item is from Amazon
func (pr *PurchaseRequest) HasAmazonItems() bool {
	for _, item := range pr.Items {
		if item.IsAmazonURL {
			return true
		}
	}
	return pr.IsAmazonURL
}

// GenerateRequestNumber generates a unique purchase request number (PR-YYYY-XXXX)
// Uses MAX to find the highest number used this year, ensuring numbers are never reused
func GenerateRequestNumber(db *gorm.DB) string {
	year := time.Now().Year()
	prefix := fmt.Sprintf("PR-%d-", year)

	// Find the highest PR number for this year
	var lastRequest PurchaseRequest
	err := db.Where("request_number LIKE ?", prefix+"%").
		Order("request_number DESC").
		First(&lastRequest).Error

	if err != nil {
		// No requests this year yet, start at 0001
		return fmt.Sprintf("PR-%d-%04d", year, 1)
	}

	// Extract the sequence number from the last request number
	// Format is PR-YYYY-XXXX, so we need the last 4 characters
	lastNum := lastRequest.RequestNumber
	if len(lastNum) >= 4 {
		seqStr := lastNum[len(lastNum)-4:]
		seq, _ := strconv.Atoi(seqStr)
		return fmt.Sprintf("PR-%d-%04d", year, seq+1)
	}

	// Fallback: count all requests (shouldn't happen with proper data)
	var count int64
	db.Model(&PurchaseRequest{}).Where("request_number LIKE ?", prefix+"%").Count(&count)
	return fmt.Sprintf("PR-%d-%04d", year, count+1)
}

// GeneratePONumber generates a purchase order number from the request number
// This converts PR-YYYY-XXXX to PO-YYYY-XXXX so both numbers match
// This is called when a request is approved
func GeneratePONumber(requestNumber string) *string {
	// Simply replace PR- prefix with PO- prefix to keep the same number
	poNumber := strings.Replace(requestNumber, "PR-", "PO-", 1)
	return &poNumber
}

// CanBeCancelled checks if the request can be cancelled
func (pr *PurchaseRequest) CanBeCancelled() bool {
	return pr.Status == StatusPending || pr.Status == StatusInfoRequested
}

// CanBeApproved checks if the request can be approved
func (pr *PurchaseRequest) CanBeApproved() bool {
	return pr.Status == StatusPending
}

// CanBeRejected checks if the request can be rejected
func (pr *PurchaseRequest) CanBeRejected() bool {
	return pr.Status == StatusPending
}

// CanRequestInfo checks if more info can be requested
func (pr *PurchaseRequest) CanRequestInfo() bool {
	return pr.Status == StatusPending
}

// CanBeMarkedPurchased checks if the request can be marked as purchased
func (pr *PurchaseRequest) CanBeMarkedPurchased() bool {
	return pr.Status == StatusApproved
}

// CanBeMarkedDelivered checks if the request can be marked as delivered
func (pr *PurchaseRequest) CanBeMarkedDelivered() bool {
	return pr.Status == StatusPurchased
}

// CanBeCancelledAfterPurchase checks if the request can be cancelled after purchase
func (pr *PurchaseRequest) CanBeCancelledAfterPurchase() bool {
	return pr.Status == StatusPurchased || pr.Status == StatusApproved
}

// IsPending checks if the request is pending
func (pr *PurchaseRequest) IsPending() bool {
	return pr.Status == StatusPending
}

// IsApproved checks if the request is approved
func (pr *PurchaseRequest) IsApproved() bool {
	return pr.Status == StatusApproved
}

// IsUrgent checks if the request is urgent
func (pr *PurchaseRequest) IsUrgent() bool {
	return pr.Urgency == UrgencyUrgent
}
