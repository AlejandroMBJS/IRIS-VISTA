package handlers

import (
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services/amazon"
	"vista-backend/internal/services/metadata"
	"vista-backend/internal/services/notifications"
	"vista-backend/internal/services/translation"
	"vista-backend/pkg/response"
)

type RequestHandler struct {
	db              *gorm.DB
	metadataService *metadata.Service
	notificationSvc *notifications.NotificationService
	asyncTranslator *translation.AsyncTranslator
}

func NewRequestHandler(db *gorm.DB) *RequestHandler {
	return &RequestHandler{
		db:              db,
		metadataService: metadata.NewService(),
		notificationSvc: notifications.NewNotificationService(db),
		asyncTranslator: translation.NewAsyncTranslator(db),
	}
}

// getUserLanguage extracts user's preferred language from request headers
func (h *RequestHandler) getUserLanguage(c *gin.Context) string {
	// First check custom header (set by frontend)
	if lang := c.GetHeader("X-User-Language"); lang != "" {
		lang = strings.ToLower(lang)
		if lang == "en" || lang == "zh" || lang == "es" {
			return lang
		}
	}

	// Fallback to Accept-Language header
	acceptLang := c.GetHeader("Accept-Language")
	if strings.HasPrefix(strings.ToLower(acceptLang), "zh") {
		return "zh"
	}
	if strings.HasPrefix(strings.ToLower(acceptLang), "es") {
		return "es"
	}

	return "en"
}

// CreateRequestItemInput represents a single product item in a multi-product request
type CreateRequestItemInput struct {
	URL                string   `json:"url"` // URL is optional for catalog products
	Quantity           int      `json:"quantity" binding:"required,gte=1"`
	ProductTitle       string   `json:"product_title"`
	ProductImageURL    string   `json:"product_image_url"`
	ProductDescription string   `json:"product_description"`
	EstimatedPrice     *float64 `json:"estimated_price"`
	Currency           string   `json:"currency"`
}

// CreateRequestInput represents the input for creating a new purchase request
// Supports both single-product (legacy) and multi-product requests
type CreateRequestInput struct {
	// Multi-product support - array of items
	Items []CreateRequestItemInput `json:"items"`

	// Legacy single-product fields (for backward compatibility)
	URL           string   `json:"url"`
	Quantity      int      `json:"quantity"`
	ProductTitle       string   `json:"product_title"`
	ProductImageURL    string   `json:"product_image_url"`
	ProductDescription string   `json:"product_description"`
	EstimatedPrice     *float64 `json:"estimated_price"`
	Currency           string   `json:"currency"`

	// Common fields
	Justification string   `json:"justification" binding:"required"`
	Urgency       string   `json:"urgency" binding:"omitempty,oneof=normal urgent"`
}

// ExtractMetadataInput represents the input for metadata extraction
type ExtractMetadataInput struct {
	URL string `json:"url" binding:"required,url"`
}

// RequestItemResponse represents a single item in a purchase request
type RequestItemResponse struct {
	ID                 uint       `json:"id"`
	URL                string     `json:"url"`
	ProductTitle       string     `json:"product_title"`
	ProductImageURL    string     `json:"product_image_url"`
	ProductDescription string     `json:"product_description,omitempty"`
	EstimatedPrice     *float64   `json:"estimated_price,omitempty"`
	Currency           string     `json:"currency"`
	Quantity           int        `json:"quantity"`
	Subtotal           float64    `json:"subtotal"`
	IsAmazonURL        bool       `json:"is_amazon_url"`
	AmazonASIN         string     `json:"amazon_asin,omitempty"`
	AddedToCart        bool       `json:"added_to_cart"`
	AddedToCartAt      *time.Time `json:"added_to_cart_at,omitempty"`
	CartError          string     `json:"cart_error,omitempty"`
}

// RequestResponse represents the response for a purchase request
type RequestResponse struct {
	ID                 uint          `json:"id"`
	RequestNumber      string        `json:"request_number"`
	PONumber           string        `json:"po_number,omitempty"`

	// Multi-product support
	Items          []RequestItemResponse `json:"items,omitempty"`
	ProductCount   int                   `json:"product_count"`
	TotalEstimated *float64              `json:"total_estimated,omitempty"`

	// Legacy single-product fields (for backward compatibility)
	URL                string        `json:"url,omitempty"`
	ProductTitle       string        `json:"product_title,omitempty"`
	ProductImageURL    string        `json:"product_image_url,omitempty"`
	ProductDescription string        `json:"product_description,omitempty"`
	EstimatedPrice     *float64      `json:"estimated_price,omitempty"`
	Currency           string        `json:"currency"`
	Quantity           int           `json:"quantity"`

	Justification      string        `json:"justification"`
	Urgency            string        `json:"urgency"`
	RequesterID        uint          `json:"requester_id"`
	Requester          *UserResponse `json:"requester,omitempty"`
	Status             string        `json:"status"`

	// Amazon specific (legacy single-product)
	IsAmazonURL   bool       `json:"is_amazon_url"`
	AddedToCart   bool       `json:"added_to_cart"`
	AddedToCartAt *time.Time `json:"added_to_cart_at,omitempty"`
	CartError     string     `json:"cart_error,omitempty"`
	AmazonASIN    string     `json:"amazon_asin,omitempty"`

	// Approval info
	ApprovedBy      *UserResponse `json:"approved_by,omitempty"`
	ApprovedAt      *time.Time    `json:"approved_at,omitempty"`
	RejectedBy      *UserResponse `json:"rejected_by,omitempty"`
	RejectedAt      *time.Time    `json:"rejected_at,omitempty"`
	RejectionReason string        `json:"rejection_reason,omitempty"`

	// Info request
	InfoRequestedAt *time.Time `json:"info_requested_at,omitempty"`
	InfoRequestNote string     `json:"info_request_note,omitempty"`

	// Purchase info
	PurchasedBy   *UserResponse `json:"purchased_by,omitempty"`
	PurchasedAt   *time.Time    `json:"purchased_at,omitempty"`
	PurchaseNotes string        `json:"purchase_notes,omitempty"`
	OrderNumber   string        `json:"order_number,omitempty"`

	// Delivery info
	DeliveredBy   *UserResponse `json:"delivered_by,omitempty"`
	DeliveredAt   *time.Time    `json:"delivered_at,omitempty"`
	DeliveryNotes string        `json:"delivery_notes,omitempty"`

	// Cancellation info
	CancelledBy       *UserResponse `json:"cancelled_by,omitempty"`
	CancelledAt       *time.Time    `json:"cancelled_at,omitempty"`
	CancellationNotes string        `json:"cancellation_notes,omitempty"`

	// Admin notes (visible to admin, purchase_admin, gm, and requester)
	AdminNotes string `json:"admin_notes,omitempty"`

	// Translated fields
	JustificationTranslated     models.JSONB `json:"justification_translated,omitempty"`
	RejectionReasonTranslated   models.JSONB `json:"rejection_reason_translated,omitempty"`
	InfoRequestNoteTranslated   models.JSONB `json:"info_request_note_translated,omitempty"`
	PurchaseNotesTranslated     models.JSONB `json:"purchase_notes_translated,omitempty"`
	DeliveryNotesTranslated     models.JSONB `json:"delivery_notes_translated,omitempty"`
	CancellationNotesTranslated models.JSONB `json:"cancellation_notes_translated,omitempty"`
	AdminNotesTranslated        models.JSONB `json:"admin_notes_translated,omitempty"`

	// History
	History []RequestHistoryResponse `json:"history,omitempty"`

	// Timestamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RequestHistoryResponse struct {
	ID                uint          `json:"id"`
	UserID            uint          `json:"user_id"`
	User              *UserResponse `json:"user,omitempty"`
	Action            string        `json:"action"`
	Comment           string        `json:"comment"`
	CommentTranslated models.JSONB  `json:"comment_translated,omitempty"`
	OldStatus         string        `json:"old_status"`
	NewStatus         string        `json:"new_status"`
	CreatedAt         time.Time     `json:"created_at"`
}

func requestToResponse(r models.PurchaseRequest) RequestResponse {
	// Calculate totals
	r.CalculateTotals()

	// Get PO number if it exists
	poNumber := ""
	if r.PONumber != nil {
		poNumber = *r.PONumber
	}

	resp := RequestResponse{
		ID:                 r.ID,
		RequestNumber:      r.RequestNumber,
		PONumber:           poNumber,
		ProductCount:       r.ProductCount,
		TotalEstimated:     r.TotalEstimated,
		URL:                r.URL,
		ProductTitle:       r.ProductTitle,
		ProductImageURL:    r.ProductImageURL,
		ProductDescription: r.ProductDescription,
		EstimatedPrice:     r.EstimatedPrice,
		Currency:           r.Currency,
		Quantity:           r.Quantity,
		Justification:      r.Justification,
		Urgency:            string(r.Urgency),
		RequesterID:        r.RequesterID,
		Status:             string(r.Status),
		IsAmazonURL:        r.IsAmazonURL,
		AddedToCart:        r.AddedToCart,
		AddedToCartAt:      r.AddedToCartAt,
		CartError:          r.CartError,
		AmazonASIN:         r.AmazonASIN,
		ApprovedAt:         r.ApprovedAt,
		RejectedAt:         r.RejectedAt,
		RejectionReason:    r.RejectionReason,
		InfoRequestedAt:    r.InfoRequestedAt,
		InfoRequestNote:    r.InfoRequestNote,
		PurchasedAt:        r.PurchasedAt,
		PurchaseNotes:      r.PurchaseNotes,
		OrderNumber:        r.OrderNumber,
		DeliveredAt:        r.DeliveredAt,
		DeliveryNotes:      r.DeliveryNotes,
		CancelledAt:        r.CancelledAt,
		CancellationNotes:  r.CancellationNotes,
		AdminNotes:         r.AdminNotes,
		// Translated fields
		JustificationTranslated:     r.JustificationTranslated,
		RejectionReasonTranslated:   r.RejectionReasonTranslated,
		InfoRequestNoteTranslated:   r.InfoRequestNoteTranslated,
		PurchaseNotesTranslated:     r.PurchaseNotesTranslated,
		DeliveryNotesTranslated:     r.DeliveryNotesTranslated,
		CancellationNotesTranslated: r.CancellationNotesTranslated,
		AdminNotesTranslated:        r.AdminNotesTranslated,
		CreatedAt:                   r.CreatedAt,
		UpdatedAt:                   r.UpdatedAt,
	}

	// Add items if multi-product request
	for _, item := range r.Items {
		resp.Items = append(resp.Items, RequestItemResponse{
			ID:                 item.ID,
			URL:                item.URL,
			ProductTitle:       item.ProductTitle,
			ProductImageURL:    item.ProductImageURL,
			ProductDescription: item.ProductDescription,
			EstimatedPrice:     item.EstimatedPrice,
			Currency:           item.Currency,
			Quantity:           item.Quantity,
			Subtotal:           item.Subtotal(),
			IsAmazonURL:        item.IsAmazonURL,
			AmazonASIN:         item.AmazonASIN,
			AddedToCart:        item.AddedToCart,
			AddedToCartAt:      item.AddedToCartAt,
			CartError:          item.CartError,
		})
	}

	if r.Requester.ID != 0 {
		resp.Requester = &UserResponse{
			ID:          r.Requester.ID,
			Email:       r.Requester.Email,
			Name:        r.Requester.Name,
			Role:        string(r.Requester.Role),
			CompanyCode: r.Requester.CompanyCode,
			CostCenter:  r.Requester.CostCenter,
			Department:  r.Requester.Department,
			Status:      string(r.Requester.Status),
		}
	}

	if r.ApprovedBy != nil && r.ApprovedBy.ID != 0 {
		resp.ApprovedBy = &UserResponse{
			ID:    r.ApprovedBy.ID,
			Email: r.ApprovedBy.Email,
			Name:  r.ApprovedBy.Name,
			Role:  string(r.ApprovedBy.Role),
		}
	}

	if r.RejectedBy != nil && r.RejectedBy.ID != 0 {
		resp.RejectedBy = &UserResponse{
			ID:    r.RejectedBy.ID,
			Email: r.RejectedBy.Email,
			Name:  r.RejectedBy.Name,
			Role:  string(r.RejectedBy.Role),
		}
	}

	if r.PurchasedBy != nil && r.PurchasedBy.ID != 0 {
		resp.PurchasedBy = &UserResponse{
			ID:    r.PurchasedBy.ID,
			Email: r.PurchasedBy.Email,
			Name:  r.PurchasedBy.Name,
			Role:  string(r.PurchasedBy.Role),
		}
	}

	if r.DeliveredBy != nil && r.DeliveredBy.ID != 0 {
		resp.DeliveredBy = &UserResponse{
			ID:    r.DeliveredBy.ID,
			Email: r.DeliveredBy.Email,
			Name:  r.DeliveredBy.Name,
			Role:  string(r.DeliveredBy.Role),
		}
	}

	if r.CancelledBy != nil && r.CancelledBy.ID != 0 {
		resp.CancelledBy = &UserResponse{
			ID:    r.CancelledBy.ID,
			Email: r.CancelledBy.Email,
			Name:  r.CancelledBy.Name,
			Role:  string(r.CancelledBy.Role),
		}
	}

	for _, h := range r.History {
		historyResp := RequestHistoryResponse{
			ID:                h.ID,
			UserID:            h.UserID,
			Action:            string(h.Action),
			Comment:           h.Comment,
			CommentTranslated: h.CommentTranslated,
			OldStatus:         string(h.OldStatus),
			NewStatus:         string(h.NewStatus),
			CreatedAt:         h.CreatedAt,
		}
		if h.User.ID != 0 {
			historyResp.User = &UserResponse{
				ID:    h.User.ID,
				Email: h.User.Email,
				Name:  h.User.Name,
				Role:  string(h.User.Role),
			}
		}
		resp.History = append(resp.History, historyResp)
	}

	return resp
}

// ExtractMetadata extracts metadata from a URL (for preview before submission)
func (h *RequestHandler) ExtractMetadata(c *gin.Context) {
	var input ExtractMetadataInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	meta, err := h.metadataService.Extract(input.URL)
	if err != nil {
		// Return partial response even on error
		response.Success(c, gin.H{
			"url":          input.URL,
			"title":        "",
			"description":  "",
			"image_url":    "",
			"price":        nil,
			"currency":     "MXN",
			"site_name":    "",
			"is_amazon":    amazon.IsAmazonURL(input.URL),
			"amazon_asin":  amazon.ExtractASIN(input.URL),
			"error":        err.Error(),
		})
		return
	}

	response.Success(c, gin.H{
		"url":                    input.URL,
		"title":                  meta.Title,
		"description":            meta.Description,
		"image_url":              meta.ImageURL,
		"price":                  meta.Price,
		"currency":               meta.Currency,
		"site_name":              meta.SiteName,
		"is_amazon":              amazon.IsAmazonURL(input.URL),
		"amazon_asin":            amazon.ExtractASIN(input.URL),
		"title_translated":       meta.TitleTranslated,
		"description_translated": meta.DescTranslated,
		"error":                  nil,
	})
}

// CreateRequest creates a new purchase request (supports both single and multi-product)
func (h *RequestHandler) CreateRequest(c *gin.Context) {
	var input CreateRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)

	urgency := models.UrgencyNormal
	if input.Urgency == "urgent" {
		urgency = models.UrgencyUrgent
	}

	request := models.PurchaseRequest{
		RequestNumber: models.GenerateRequestNumber(h.db),
		Justification: input.Justification,
		Urgency:       urgency,
		RequesterID:   userID,
		Status:        models.StatusPending,
	}

	// Translate justification (sync for user's language, async for others)
	userLang := h.getUserLanguage(c)
	if input.Justification != "" {
		translationResult, _ := h.asyncTranslator.TranslateField(
			input.Justification,
			userLang,
			func(t *translation.TranslatedText) error {
				// Background callback to save complete translations
				return h.db.Model(&models.PurchaseRequest{}).
					Where("id = ?", request.ID).
					Update("justification_translated", translation.ToJSON(t)).Error
			},
		)
		if translationResult != nil {
			request.JustificationTranslated = translationResult.JSON
		}
	}

	// Check if this is a multi-product request
	if len(input.Items) > 0 {
		// Multi-product request
		request.ProductCount = len(input.Items)

		var totalEstimated float64
		for _, itemInput := range input.Items {
			// Try to extract metadata if not provided
			productTitle := itemInput.ProductTitle
			productImageURL := itemInput.ProductImageURL
			productDescription := itemInput.ProductDescription
			estimatedPrice := itemInput.EstimatedPrice
			currency := itemInput.Currency

			if productTitle == "" || productImageURL == "" {
				meta, err := h.metadataService.Extract(itemInput.URL)
				if err == nil {
					if productTitle == "" {
						productTitle = meta.Title
					}
					if productImageURL == "" {
						productImageURL = meta.ImageURL
					}
					if productDescription == "" {
						productDescription = meta.Description
					}
					if estimatedPrice == nil && meta.Price != nil {
						estimatedPrice = meta.Price
					}
					if currency == "" && meta.Currency != "" {
						currency = meta.Currency
					}
				}
			}

			if currency == "" {
				currency = "MXN"
			}

			// Check if it's an Amazon URL
			isAmazonURL := amazon.IsAmazonURL(itemInput.URL)
			amazonASIN := ""
			if isAmazonURL {
				amazonASIN = amazon.ExtractASIN(itemInput.URL)
			}

			item := models.PurchaseRequestItem{
				URL:                itemInput.URL,
				ProductTitle:       productTitle,
				ProductImageURL:    productImageURL,
				ProductDescription: productDescription,
				EstimatedPrice:     estimatedPrice,
				Currency:           currency,
				Quantity:           itemInput.Quantity,
				IsAmazonURL:        isAmazonURL,
				AmazonASIN:         amazonASIN,
			}

			request.Items = append(request.Items, item)

			// Calculate total
			if estimatedPrice != nil {
				totalEstimated += *estimatedPrice * float64(itemInput.Quantity)
			}
		}

		if totalEstimated > 0 {
			request.TotalEstimated = &totalEstimated
		}

		// Set legacy fields from first item for backward compatibility
		if len(request.Items) > 0 {
			first := request.Items[0]
			request.URL = first.URL
			request.ProductTitle = first.ProductTitle
			request.ProductImageURL = first.ProductImageURL
			request.ProductDescription = first.ProductDescription
			request.EstimatedPrice = first.EstimatedPrice
			request.Currency = first.Currency
			request.Quantity = first.Quantity
			request.IsAmazonURL = first.IsAmazonURL
			request.AmazonASIN = first.AmazonASIN
		}
	} else if input.URL != "" {
		// Legacy single-product request
		productTitle := input.ProductTitle
		productImageURL := input.ProductImageURL
		productDescription := input.ProductDescription
		estimatedPrice := input.EstimatedPrice
		currency := input.Currency

		if productTitle == "" || productImageURL == "" {
			meta, err := h.metadataService.Extract(input.URL)
			if err == nil {
				if productTitle == "" {
					productTitle = meta.Title
				}
				if productImageURL == "" {
					productImageURL = meta.ImageURL
				}
				if productDescription == "" {
					productDescription = meta.Description
				}
				if estimatedPrice == nil && meta.Price != nil {
					estimatedPrice = meta.Price
				}
				if currency == "" && meta.Currency != "" {
					currency = meta.Currency
				}
			}
		}

		if currency == "" {
			currency = "MXN"
		}

		// Check if it's an Amazon URL
		isAmazonURL := amazon.IsAmazonURL(input.URL)
		amazonASIN := ""
		if isAmazonURL {
			amazonASIN = amazon.ExtractASIN(input.URL)
		}

		quantity := input.Quantity
		if quantity == 0 {
			quantity = 1
		}

		request.URL = input.URL
		request.ProductTitle = productTitle
		request.ProductImageURL = productImageURL
		request.ProductDescription = productDescription
		request.EstimatedPrice = estimatedPrice
		request.Currency = currency
		request.Quantity = quantity
		request.IsAmazonURL = isAmazonURL
		request.AmazonASIN = amazonASIN
		request.ProductCount = 1

		if estimatedPrice != nil {
			total := *estimatedPrice * float64(quantity)
			request.TotalEstimated = &total
		}
	} else {
		response.BadRequest(c, "Either 'items' array or 'url' field is required")
		return
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&request).Error; err != nil {
			return err
		}

		comment := "Purchase request created"
		if len(request.Items) > 1 {
			comment = "Purchase request created with " + strconv.Itoa(len(request.Items)) + " products"
		}
		history := models.NewHistory(request.ID, userID, models.ActionCreated, "", models.StatusPending, comment)
		return tx.Create(history).Error
	})

	if err != nil {
		log.Printf("Failed to create purchase request: %v", err)
		response.InternalServerError(c, "Failed to create request: "+err.Error())
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("Items").
		Preload("History").
		Preload("History.User").
		First(&request, request.ID)

	// Send notification to approvers (async)
	go func() {
		if err := h.notificationSvc.NotifyRequestCreated(&request); err != nil {
			log.Printf("Failed to send request created notification: %v", err)
		}
	}()

	response.Created(c, requestToResponse(request))
}

// ListRequests returns a list of requests
func (h *RequestHandler) ListRequests(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")

	offset := (page - 1) * perPage
	userID := middleware.GetUserID(c)
	canViewAll := middleware.CanViewAll(c)

	query := h.db.Model(&models.PurchaseRequest{}).
		Preload("Requester").
		Preload("Items")

	if !canViewAll {
		query = query.Where("requester_id = ?", userID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var requests []models.PurchaseRequest
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&requests).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch requests")
		return
	}

	requestResponses := make([]RequestResponse, len(requests))
	for i, req := range requests {
		requestResponses[i] = requestToResponse(req)
	}

	response.SuccessWithMeta(c, requestResponses, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: response.CalculateTotalPages(total, perPage),
	})
}

// GetRequest returns a single request
func (h *RequestHandler) GetRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var req models.PurchaseRequest
	if err := h.db.
		Preload("Requester").
		Preload("Items").
		Preload("History").
		Preload("History.User").
		Preload("ApprovedBy").
		Preload("RejectedBy").
		Preload("PurchasedBy").
		First(&req, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	userID := middleware.GetUserID(c)
	canViewAll := middleware.CanViewAll(c)
	if !canViewAll && req.RequesterID != userID {
		response.Forbidden(c, "Access denied")
		return
	}

	response.Success(c, requestToResponse(req))
}

// GetMyRequests returns the current user's requests
func (h *RequestHandler) GetMyRequests(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")

	offset := (page - 1) * perPage
	userID := middleware.GetUserID(c)

	query := h.db.Model(&models.PurchaseRequest{}).
		Preload("Items").
		Where("requester_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	var requests []models.PurchaseRequest
	if err := query.Offset(offset).Limit(perPage).Order("created_at DESC").Find(&requests).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch requests")
		return
	}

	requestResponses := make([]RequestResponse, len(requests))
	for i, req := range requests {
		requestResponses[i] = requestToResponse(req)
	}

	response.SuccessWithMeta(c, requestResponses, &response.Meta{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: response.CalculateTotalPages(total, perPage),
	})
}

// CancelRequest cancels a pending request
func (h *RequestHandler) CancelRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	userID := middleware.GetUserID(c)

	var request models.PurchaseRequest
	if err := h.db.First(&request, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	if request.RequesterID != userID {
		response.Forbidden(c, "Access denied")
		return
	}

	if !request.CanBeCancelled() {
		response.BadRequest(c, "Request cannot be cancelled")
		return
	}

	oldStatus := request.Status
	request.Status = models.StatusRejected

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		history := models.NewHistory(request.ID, userID, models.ActionCancelled, oldStatus, models.StatusRejected, "Request cancelled by requester")
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to cancel request")
		return
	}

	response.SuccessWithMessage(c, "Request cancelled successfully", nil)
}

// UpdateRequest allows the requester to update their pending request
func (h *RequestHandler) UpdateRequest(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	userID := middleware.GetUserID(c)

	var request models.PurchaseRequest
	if err := h.db.First(&request, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	if request.RequesterID != userID {
		response.Forbidden(c, "Access denied")
		return
	}

	// Can only update if pending or info_requested
	if request.Status != models.StatusPending && request.Status != models.StatusInfoRequested {
		response.BadRequest(c, "Request cannot be updated in current status")
		return
	}

	var input struct {
		Quantity           int      `json:"quantity"`
		Justification      string   `json:"justification"`
		Urgency            string   `json:"urgency"`
		ProductTitle       string   `json:"product_title"`
		ProductDescription string   `json:"product_description"`
		EstimatedPrice     *float64 `json:"estimated_price"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	// Update fields if provided
	if input.Quantity > 0 {
		request.Quantity = input.Quantity
	}
	if input.Justification != "" {
		request.Justification = input.Justification
	}
	if input.Urgency != "" {
		if input.Urgency == "urgent" {
			request.Urgency = models.UrgencyUrgent
		} else {
			request.Urgency = models.UrgencyNormal
		}
	}
	if input.ProductTitle != "" {
		request.ProductTitle = input.ProductTitle
	}
	if input.ProductDescription != "" {
		request.ProductDescription = input.ProductDescription
	}
	if input.EstimatedPrice != nil {
		request.EstimatedPrice = input.EstimatedPrice
	}

	// If status was info_requested, change back to pending
	if request.Status == models.StatusInfoRequested {
		request.Status = models.StatusPending
	}

	if err := h.db.Save(&request).Error; err != nil {
		response.InternalServerError(c, "Failed to update request")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("History").
		Preload("History.User").
		First(&request, request.ID)

	response.Success(c, requestToResponse(request))
}
