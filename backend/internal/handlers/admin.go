package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"vista-backend/internal/middleware"
	"vista-backend/internal/models"
	"vista-backend/internal/services/amazon"
	"vista-backend/internal/services/translation"
	"vista-backend/pkg/crypto"
	"vista-backend/pkg/response"
)

type AdminHandler struct {
	db              *gorm.DB
	encryptionSvc   *crypto.EncryptionService
	amazonSvc       *amazon.AutomationService
	asyncTranslator *translation.AsyncTranslator
}

func NewAdminHandler(db *gorm.DB, encryptionSvc *crypto.EncryptionService, amazonSvc *amazon.AutomationService) *AdminHandler {
	return &AdminHandler{
		db:              db,
		encryptionSvc:   encryptionSvc,
		amazonSvc:       amazonSvc,
		asyncTranslator: translation.NewAsyncTranslator(db),
	}
}

// getUserLanguage extracts user's preferred language from request headers
func (h *AdminHandler) getUserLanguage(c *gin.Context) string {
	if lang := c.GetHeader("X-User-Language"); lang != "" {
		lang = strings.ToLower(lang)
		if lang == "en" || lang == "zh" || lang == "es" {
			return lang
		}
	}
	acceptLang := c.GetHeader("Accept-Language")
	if strings.HasPrefix(strings.ToLower(acceptLang), "zh") {
		return "zh"
	}
	if strings.HasPrefix(strings.ToLower(acceptLang), "es") {
		return "es"
	}
	return "en"
}

// Amazon Config types

type AmazonConfigRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password"`
	Marketplace string `json:"marketplace"`
	IsActive    *bool  `json:"is_active"`
}

type AmazonConfigResponse struct {
	ID          uint       `json:"id"`
	Email       string     `json:"email"`
	Marketplace string     `json:"marketplace"`
	HasPassword bool       `json:"has_password"`
	IsActive    bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at"`
	LastTestAt  *time.Time `json:"last_test_at"`
	TestStatus  string     `json:"test_status"`
	TestMessage string     `json:"test_message"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// GetAmazonConfig returns the current Amazon configuration
func (h *AdminHandler) GetAmazonConfig(c *gin.Context) {
	var config models.AmazonConfig
	if err := h.db.First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.Success(c, AmazonConfigResponse{
				Marketplace: "www.amazon.com.mx",
				IsActive:    false,
				HasPassword: false,
			})
			return
		}
		response.InternalServerError(c, "Failed to fetch Amazon config")
		return
	}

	response.Success(c, AmazonConfigResponse{
		ID:          config.ID,
		Email:       config.Email,
		Marketplace: config.Marketplace,
		HasPassword: config.EncryptedPassword != "",
		IsActive:    config.IsActive,
		LastLoginAt: config.LastLoginAt,
		LastTestAt:  config.LastTestAt,
		TestStatus:  config.TestStatus,
		TestMessage: config.TestMessage,
		CreatedAt:   config.CreatedAt,
		UpdatedAt:   config.UpdatedAt,
	})
}

// SaveAmazonConfig saves or updates the Amazon configuration
func (h *AdminHandler) SaveAmazonConfig(c *gin.Context) {
	var req AmazonConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request: "+err.Error())
		return
	}

	userID := middleware.GetUserID(c)

	var config models.AmazonConfig
	isNew := h.db.First(&config).Error == gorm.ErrRecordNotFound

	config.Email = req.Email

	if req.Marketplace != "" {
		config.Marketplace = req.Marketplace
	} else if config.Marketplace == "" {
		config.Marketplace = "www.amazon.com.mx"
	}

	if req.Password != "" {
		encryptedPassword, err := h.encryptionSvc.Encrypt(req.Password)
		if err != nil {
			response.InternalServerError(c, "Failed to encrypt password")
			return
		}
		config.EncryptedPassword = encryptedPassword
	}

	if req.IsActive != nil {
		config.IsActive = *req.IsActive
	} else {
		config.IsActive = true
	}

	if isNew {
		config.CreatedByID = userID
		if err := h.db.Create(&config).Error; err != nil {
			response.InternalServerError(c, "Failed to create Amazon config")
			return
		}
	} else {
		if err := h.db.Save(&config).Error; err != nil {
			response.InternalServerError(c, "Failed to update Amazon config")
			return
		}
	}

	response.SuccessWithMessage(c, "Amazon configuration saved", AmazonConfigResponse{
		ID:          config.ID,
		Email:       config.Email,
		Marketplace: config.Marketplace,
		HasPassword: config.EncryptedPassword != "",
		IsActive:    config.IsActive,
		LastLoginAt: config.LastLoginAt,
		LastTestAt:  config.LastTestAt,
		TestStatus:  config.TestStatus,
		TestMessage: config.TestMessage,
		CreatedAt:   config.CreatedAt,
		UpdatedAt:   config.UpdatedAt,
	})
}

// TestAmazonConnection tests the Amazon Business connection
func (h *AdminHandler) TestAmazonConnection(c *gin.Context) {
	var config models.AmazonConfig
	if err := h.db.First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.BadRequest(c, "Amazon configuration not found")
			return
		}
		response.InternalServerError(c, "Failed to fetch Amazon config")
		return
	}

	if !config.IsConfigured() {
		response.BadRequest(c, "Amazon configuration is incomplete")
		return
	}

	// Decrypt password
	password, err := h.encryptionSvc.Decrypt(config.EncryptedPassword)
	if err != nil {
		response.InternalServerError(c, "Failed to decrypt password")
		return
	}

	// Set credentials
	h.amazonSvc.SetCredentials(config.Email, password, config.Marketplace)

	// Initialize browser
	if err := h.amazonSvc.Initialize(); err != nil {
		now := time.Now()
		config.LastTestAt = &now
		config.TestStatus = "failed"
		config.TestMessage = "Failed to initialize browser: " + err.Error()
		h.db.Save(&config)

		response.BadRequest(c, config.TestMessage)
		return
	}

	// Try to login
	if err := h.amazonSvc.Login(); err != nil {
		now := time.Now()
		config.LastTestAt = &now
		config.TestStatus = "failed"
		config.TestMessage = "Login failed: " + err.Error()
		h.db.Save(&config)

		response.BadRequest(c, config.TestMessage)
		return
	}

	// Success
	now := time.Now()
	config.LastTestAt = &now
	config.LastLoginAt = &now
	config.TestStatus = "success"
	config.TestMessage = "Connection successful"
	h.db.Save(&config)

	response.SuccessWithMessage(c, "Connection test successful", map[string]interface{}{
		"status":  config.TestStatus,
		"message": config.TestMessage,
	})
}

// GetAmazonSessionStatus returns the current Amazon session status
func (h *AdminHandler) GetAmazonSessionStatus(c *gin.Context) {
	status := h.amazonSvc.GetSessionStatus()
	response.Success(c, status)
}

// GetApprovedOrders returns all approved orders for the admin dashboard
func (h *AdminHandler) GetApprovedOrders(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	filter := c.Query("filter") // all, amazon_cart, pending_manual, purchased, delivered, cancelled

	offset := (page - 1) * perPage

	query := h.db.Model(&models.PurchaseRequest{}).
		Preload("Requester").
		Preload("ApprovedBy").
		Preload("PurchasedBy").
		Preload("DeliveredBy").
		Preload("CancelledBy").
		Preload("Items")

	// Filter by status
	switch filter {
	case "amazon_cart":
		query = query.Where("status = ? AND is_amazon_url = ? AND added_to_cart = ?", models.StatusApproved, true, true)
	case "pending_manual":
		query = query.Where("status = ? AND (is_amazon_url = ? OR (is_amazon_url = ? AND added_to_cart = ?))",
			models.StatusApproved, false, true, false)
	case "purchased":
		query = query.Where("status = ?", models.StatusPurchased)
	case "delivered":
		query = query.Where("status = ?", models.StatusDelivered)
	case "cancelled":
		query = query.Where("status = ?", models.StatusCancelled)
	default:
		// Default: show all approved, purchased, delivered, and cancelled
		query = query.Where("status IN (?, ?, ?, ?)", models.StatusApproved, models.StatusPurchased, models.StatusDelivered, models.StatusCancelled)
	}

	var total int64
	query.Count(&total)

	var requests []models.PurchaseRequest
	if err := query.Offset(offset).Limit(perPage).Order("approved_at DESC").Find(&requests).Error; err != nil {
		response.InternalServerError(c, "Failed to fetch approved orders")
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

// MarkAsPurchased marks an approved order as purchased
func (h *AdminHandler) MarkAsPurchased(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var input struct {
		Notes       string `json:"notes"`
		OrderNumber string `json:"order_number"`
	}
	c.ShouldBindJSON(&input)

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

	if !request.CanBeMarkedPurchased() {
		response.BadRequest(c, "Only approved requests can be marked as purchased")
		return
	}

	now := time.Now()
	request.Status = models.StatusPurchased
	request.PurchasedByID = &userID
	request.PurchasedAt = &now
	request.PurchaseNotes = input.Notes
	request.OrderNumber = input.OrderNumber

	// Translate purchase notes
	if input.Notes != "" {
		userLang := h.getUserLanguage(c)
		translationResult, _ := h.asyncTranslator.TranslateField(
			input.Notes,
			userLang,
			func(t *translation.TranslatedText) error {
				return h.db.Model(&models.PurchaseRequest{}).
					Where("id = ?", request.ID).
					Update("purchase_notes_translated", translation.ToJSON(t)).Error
			},
		)
		if translationResult != nil {
			request.PurchaseNotesTranslated = translationResult.JSON
		}
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		history := models.NewHistory(request.ID, userID, models.ActionCompleted, models.StatusApproved, models.StatusPurchased, "Marked as purchased")
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to mark as purchased")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("ApprovedBy").
		Preload("PurchasedBy").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Order marked as purchased", requestToResponse(request))
}

// RetryAddToCart retries adding an Amazon product to cart
func (h *AdminHandler) RetryAddToCart(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var request models.PurchaseRequest
	if err := h.db.First(&request, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	if !request.IsAmazonURL {
		response.BadRequest(c, "This is not an Amazon product")
		return
	}

	if request.Status != models.StatusApproved {
		response.BadRequest(c, "Only approved requests can be added to cart")
		return
	}

	// Check Amazon config
	var config models.AmazonConfig
	if err := h.db.First(&config).Error; err != nil {
		response.BadRequest(c, "Amazon is not configured")
		return
	}

	if !config.CanConnect() {
		response.BadRequest(c, "Amazon is not configured or inactive")
		return
	}

	// Decrypt password
	password, err := h.encryptionSvc.Decrypt(config.EncryptedPassword)
	if err != nil {
		response.InternalServerError(c, "Failed to decrypt credentials")
		return
	}

	// Set credentials
	h.amazonSvc.SetCredentials(config.Email, password, config.Marketplace)

	// Initialize browser
	if err := h.amazonSvc.Initialize(); err != nil {
		response.BadRequest(c, "Failed to initialize browser: "+err.Error())
		return
	}

	// Login if needed
	if !h.amazonSvc.IsLoggedIn() {
		if err := h.amazonSvc.Login(); err != nil {
			response.BadRequest(c, "Failed to login to Amazon: "+err.Error())
			return
		}
	}

	// Add to cart
	if err := h.amazonSvc.AddToCart(request.URL, request.Quantity); err != nil {
		request.CartError = "Retry failed: " + err.Error()
		h.db.Save(&request)
		response.BadRequest(c, request.CartError)
		return
	}

	// Update as successful
	now := time.Now()
	request.AddedToCart = true
	request.AddedToCartAt = &now
	request.CartError = ""
	h.db.Save(&request)

	response.SuccessWithMessage(c, "Product added to Amazon cart", requestToResponse(request))
}

// UpdateOrderNotes updates admin notes for an order
func (h *AdminHandler) UpdateOrderNotes(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var input struct {
		AdminNotes string `json:"admin_notes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Invalid request body")
		return
	}

	var request models.PurchaseRequest
	if err := h.db.First(&request, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	// Update admin notes
	request.AdminNotes = input.AdminNotes

	// Translate admin notes
	if input.AdminNotes != "" {
		userLang := h.getUserLanguage(c)
		translationResult, _ := h.asyncTranslator.TranslateField(
			input.AdminNotes,
			userLang,
			func(t *translation.TranslatedText) error {
				return h.db.Model(&models.PurchaseRequest{}).
					Where("id = ?", request.ID).
					Update("admin_notes_translated", translation.ToJSON(t)).Error
			},
		)
		if translationResult != nil {
			request.AdminNotesTranslated = translationResult.JSON
		}
	}

	if err := h.db.Save(&request).Error; err != nil {
		response.InternalServerError(c, "Failed to update notes")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("ApprovedBy").
		Preload("PurchasedBy").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Notes updated", requestToResponse(request))
}

// MarkAsDelivered marks a purchased order as delivered
func (h *AdminHandler) MarkAsDelivered(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var input struct {
		Notes string `json:"notes"`
	}
	c.ShouldBindJSON(&input)

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

	if !request.CanBeMarkedDelivered() {
		response.BadRequest(c, "Only purchased orders can be marked as delivered")
		return
	}

	oldStatus := request.Status
	now := time.Now()
	request.Status = models.StatusDelivered
	request.DeliveredByID = &userID
	request.DeliveredAt = &now
	request.DeliveryNotes = input.Notes

	// Translate delivery notes
	if input.Notes != "" {
		userLang := h.getUserLanguage(c)
		translationResult, _ := h.asyncTranslator.TranslateField(
			input.Notes,
			userLang,
			func(t *translation.TranslatedText) error {
				return h.db.Model(&models.PurchaseRequest{}).
					Where("id = ?", request.ID).
					Update("delivery_notes_translated", translation.ToJSON(t)).Error
			},
		)
		if translationResult != nil {
			request.DeliveryNotesTranslated = translationResult.JSON
		}
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		comment := "Order marked as delivered"
		if input.Notes != "" {
			comment = input.Notes
		}
		history := models.NewHistory(request.ID, userID, models.ActionDelivered, oldStatus, models.StatusDelivered, comment)
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to mark as delivered")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("ApprovedBy").
		Preload("PurchasedBy").
		Preload("DeliveredBy").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Order marked as delivered", requestToResponse(request))
}

// CancelOrder cancels an approved or purchased order
func (h *AdminHandler) CancelOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	var input struct {
		Notes string `json:"notes" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		response.BadRequest(c, "Cancellation reason is required")
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

	if !request.CanBeCancelledAfterPurchase() {
		response.BadRequest(c, "This order cannot be cancelled")
		return
	}

	oldStatus := request.Status
	now := time.Now()
	request.Status = models.StatusCancelled
	request.CancelledByID = &userID
	request.CancelledAt = &now
	request.CancellationNotes = input.Notes

	// Translate cancellation notes
	userLang := h.getUserLanguage(c)
	translationResult, _ := h.asyncTranslator.TranslateField(
		input.Notes,
		userLang,
		func(t *translation.TranslatedText) error {
			return h.db.Model(&models.PurchaseRequest{}).
				Where("id = ?", request.ID).
				Update("cancellation_notes_translated", translation.ToJSON(t)).Error
		},
	)
	if translationResult != nil {
		request.CancellationNotesTranslated = translationResult.JSON
	}

	err = h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&request).Error; err != nil {
			return err
		}

		history := models.NewHistory(request.ID, userID, models.ActionCancelled, oldStatus, models.StatusCancelled, input.Notes)
		return tx.Create(history).Error
	})

	if err != nil {
		response.InternalServerError(c, "Failed to cancel order")
		return
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("ApprovedBy").
		Preload("PurchasedBy").
		Preload("CancelledBy").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Order cancelled", requestToResponse(request))
}

// MarkItemPurchased marks a single item within a request as purchased
func (h *AdminHandler) MarkItemPurchased(c *gin.Context) {
	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	itemID, err := strconv.ParseUint(c.Param("item_id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid item ID")
		return
	}

	// Get the purchase request
	var request models.PurchaseRequest
	if err := h.db.Preload("Items").First(&request, requestID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	// Check status
	if request.Status != models.StatusApproved && request.Status != models.StatusPurchased {
		response.BadRequest(c, "Only approved or in-progress requests can have items marked as purchased")
		return
	}

	// Find and update the item
	var itemFound bool
	now := time.Now()
	for i := range request.Items {
		if request.Items[i].ID == uint(itemID) {
			request.Items[i].IsPurchased = true
			request.Items[i].PurchasedAt = &now
			itemFound = true
			if err := h.db.Save(&request.Items[i]).Error; err != nil {
				response.InternalServerError(c, "Failed to update item")
				return
			}
			break
		}
	}

	if !itemFound {
		response.NotFound(c, "Item not found in this request")
		return
	}

	// Reload items to check purchase progress
	h.db.Preload("Items").First(&request, requestID)

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("ApprovedBy").
		Preload("PurchasedBy").
		Preload("Items").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "Item marked as purchased", requestToResponse(request))
}

// MarkAllItemsPurchased marks all items within a request as purchased
func (h *AdminHandler) MarkAllItemsPurchased(c *gin.Context) {
	requestID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.BadRequest(c, "Invalid request ID")
		return
	}

	// Get the purchase request
	var request models.PurchaseRequest
	if err := h.db.Preload("Items").First(&request, requestID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.NotFound(c, "Request not found")
		} else {
			response.InternalServerError(c, "Failed to fetch request")
		}
		return
	}

	// Check status
	if request.Status != models.StatusApproved && request.Status != models.StatusPurchased {
		response.BadRequest(c, "Only approved or in-progress requests can have items marked as purchased")
		return
	}

	// Mark all items as purchased
	now := time.Now()
	for i := range request.Items {
		if !request.Items[i].IsPurchased {
			request.Items[i].IsPurchased = true
			request.Items[i].PurchasedAt = &now
			if err := h.db.Save(&request.Items[i]).Error; err != nil {
				response.InternalServerError(c, "Failed to update items")
				return
			}
		}
	}

	// Reload with relations
	h.db.
		Preload("Requester").
		Preload("ApprovedBy").
		Preload("PurchasedBy").
		Preload("Items").
		First(&request, request.ID)

	response.SuccessWithMessage(c, "All items marked as purchased", requestToResponse(request))
}

// GetDashboardStats returns admin dashboard statistics
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	var stats struct {
		TotalUsers       int64 `json:"total_users"`
		ActiveUsers      int64 `json:"active_users"`
		PendingUsers     int64 `json:"pending_users"`
		TotalProducts    int64 `json:"total_products"`
		TotalRequests    int64 `json:"total_requests"`
		PendingApprovals int64 `json:"pending_approvals"`
		ApprovedRequests int64 `json:"approved_requests"`
		PurchasedOrders  int64 `json:"purchased_orders"`
		AmazonInCart     int64 `json:"amazon_in_cart"`
		PendingManual    int64 `json:"pending_manual"`
		AmazonConfigured bool  `json:"amazon_configured"`
	}

	h.db.Model(&models.User{}).Count(&stats.TotalUsers)
	h.db.Model(&models.User{}).Where("status = ?", "approved").Count(&stats.ActiveUsers)
	h.db.Model(&models.User{}).Where("status = ?", "pending").Count(&stats.PendingUsers)
	h.db.Model(&models.Product{}).Where("is_active = ?", true).Count(&stats.TotalProducts)
	h.db.Model(&models.PurchaseRequest{}).Count(&stats.TotalRequests)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusPending).Count(&stats.PendingApprovals)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusApproved).Count(&stats.ApprovedRequests)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ?", models.StatusPurchased).Count(&stats.PurchasedOrders)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ? AND is_amazon_url = ? AND added_to_cart = ?", models.StatusApproved, true, true).Count(&stats.AmazonInCart)
	h.db.Model(&models.PurchaseRequest{}).Where("status = ? AND (is_amazon_url = ? OR (is_amazon_url = ? AND added_to_cart = ?))",
		models.StatusApproved, false, true, false).Count(&stats.PendingManual)

	var config models.AmazonConfig
	stats.AmazonConfigured = h.db.First(&config).Error == nil && config.IsConfigured()

	response.Success(c, stats)
}
