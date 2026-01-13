package notifications

import (
	"fmt"
	"log"

	"gorm.io/gorm"
	"vista-backend/internal/models"
	"vista-backend/internal/services/email"
)

// NotificationService handles creating and sending notifications
type NotificationService struct {
	db       *gorm.DB
	emailSvc *email.EmailService
}

// NewNotificationService creates a new notification service
func NewNotificationService(db *gorm.DB) *NotificationService {
	return &NotificationService{
		db:       db,
		emailSvc: email.NewEmailService(db),
	}
}

// NotifyRequestCreated sends notification to approvers when a new request is created
func (s *NotificationService) NotifyRequestCreated(request *models.PurchaseRequest) error {
	// Find all general managers to notify
	var approvers []models.User
	if err := s.db.Where("role = ? AND status = ?", models.RoleGeneralManager, models.UserStatusApproved).Find(&approvers).Error; err != nil {
		return err
	}

	title := fmt.Sprintf("New purchase request #%s", request.RequestNumber)
	message := fmt.Sprintf("New request from %s for an estimated total of $%.2f MXN",
		request.Requester.Name, s.getTotalEstimated(request))

	isUrgent := request.IsUrgent()
	if isUrgent {
		title = "🔴 " + title + " (URGENT)"
	}

	notificationType := models.NotificationNewPendingRequest
	if isUrgent {
		notificationType = models.NotificationUrgentRequest
	}

	for _, approver := range approvers {
		notification := models.NewNotification(
			approver.ID,
			notificationType,
			title,
			message,
		).WithReference("purchase_request", request.ID).
			WithActionURL(fmt.Sprintf("/approvals?id=%d", request.ID))

		if err := s.db.Create(notification).Error; err != nil {
			return err
		}
	}

	// Send email notifications (async)
	go func() {
		if err := s.emailSvc.SendNewRequestEmail(approvers, request, isUrgent); err != nil {
			log.Printf("Failed to send new request email: %v", err)
		}
	}()

	return nil
}

// NotifyRequestApproved sends notification to requester when their request is approved
func (s *NotificationService) NotifyRequestApproved(request *models.PurchaseRequest) error {
	// Use PO number if available, otherwise fall back to request number
	orderNum := request.RequestNumber
	if request.PONumber != nil && *request.PONumber != "" {
		orderNum = *request.PONumber
	}
	title := fmt.Sprintf("Order #%s approved", orderNum)
	message := "Your purchase request has been approved and is ready to be processed."

	notification := models.NewNotification(
		request.RequesterID,
		models.NotificationRequestApproved,
		title,
		message,
	).WithReference("purchase_request", request.ID).
		WithActionURL(fmt.Sprintf("/requests?id=%d", request.ID))

	if err := s.db.Create(notification).Error; err != nil {
		return err
	}

	// Send email notification (async)
	go func() {
		var user models.User
		if err := s.db.First(&user, request.RequesterID).Error; err == nil {
			if err := s.emailSvc.SendRequestApprovedEmail(&user, request); err != nil {
				log.Printf("Failed to send approval email: %v", err)
			}
		}
	}()

	return nil
}

// NotifyRequestRejected sends notification to requester when their request is rejected
func (s *NotificationService) NotifyRequestRejected(request *models.PurchaseRequest, reason string) error {
	title := fmt.Sprintf("Request #%s rejected", request.RequestNumber)
	message := fmt.Sprintf("Your purchase request has been rejected. Reason: %s", reason)

	notification := models.NewNotification(
		request.RequesterID,
		models.NotificationRequestRejected,
		title,
		message,
	).WithReference("purchase_request", request.ID).
		WithActionURL(fmt.Sprintf("/requests?id=%d", request.ID))

	if err := s.db.Create(notification).Error; err != nil {
		return err
	}

	// Send email notification (async)
	go func() {
		var user models.User
		if err := s.db.First(&user, request.RequesterID).Error; err == nil {
			if err := s.emailSvc.SendRequestRejectedEmail(&user, request, reason); err != nil {
				log.Printf("Failed to send rejection email: %v", err)
			}
		}
	}()

	return nil
}

// NotifyRequestInfoRequired sends notification to requester when more info is needed
func (s *NotificationService) NotifyRequestInfoRequired(request *models.PurchaseRequest, note string) error {
	title := fmt.Sprintf("More information required for #%s", request.RequestNumber)
	message := fmt.Sprintf("The approver requests additional information: %s", note)

	notification := models.NewNotification(
		request.RequesterID,
		models.NotificationRequestInfoRequired,
		title,
		message,
	).WithReference("purchase_request", request.ID).
		WithActionURL(fmt.Sprintf("/requests?id=%d", request.ID))

	if err := s.db.Create(notification).Error; err != nil {
		return err
	}

	// Send email notification (async)
	go func() {
		var user models.User
		if err := s.db.First(&user, request.RequesterID).Error; err == nil {
			if err := s.emailSvc.SendRequestInfoRequiredEmail(&user, request, note); err != nil {
				log.Printf("Failed to send info required email: %v", err)
			}
		}
	}()

	return nil
}

// NotifyRequestPurchased sends notification to requester when their order is purchased
func (s *NotificationService) NotifyRequestPurchased(request *models.PurchaseRequest) error {
	// Use PO number if available
	orderNum := request.RequestNumber
	if request.PONumber != nil && *request.PONumber != "" {
		orderNum = *request.PONumber
	}
	title := fmt.Sprintf("Order #%s completed", orderNum)
	message := "Your order has been marked as purchased."

	notification := models.NewNotification(
		request.RequesterID,
		models.NotificationRequestPurchased,
		title,
		message,
	).WithReference("purchase_request", request.ID).
		WithActionURL(fmt.Sprintf("/requests?id=%d", request.ID))

	if err := s.db.Create(notification).Error; err != nil {
		return err
	}

	// Send email notification (async)
	go func() {
		var user models.User
		if err := s.db.First(&user, request.RequesterID).Error; err == nil {
			if err := s.emailSvc.SendOrderPurchasedEmail(&user, request); err != nil {
				log.Printf("Failed to send purchased email: %v", err)
			}
		}
	}()

	return nil
}

// NotifyNewApprovedOrder sends notification to purchase admins when a new order is approved
func (s *NotificationService) NotifyNewApprovedOrder(request *models.PurchaseRequest) error {
	// Find all purchase admins to notify
	var admins []models.User
	if err := s.db.Where("role IN ? AND status = ?",
		[]models.UserRole{models.RoleAdmin, models.RolePurchaseAdmin}, models.UserStatusApproved).Find(&admins).Error; err != nil {
		return err
	}

	// Use PO number if available
	orderNum := request.RequestNumber
	if request.PONumber != nil && *request.PONumber != "" {
		orderNum = *request.PONumber
	}
	title := fmt.Sprintf("New approved order #%s", orderNum)
	message := fmt.Sprintf("Order from %s ready to purchase. Total: $%.2f MXN",
		request.Requester.Name, s.getTotalEstimated(request))

	for _, admin := range admins {
		notification := models.NewNotification(
			admin.ID,
			models.NotificationNewApprovedOrder,
			title,
			message,
		).WithReference("purchase_request", request.ID).
			WithActionURL(fmt.Sprintf("/admin/orders?id=%d", request.ID))

		if err := s.db.Create(notification).Error; err != nil {
			return err
		}
	}

	return nil
}

// getTotalEstimated returns the total estimated price for a request
func (s *NotificationService) getTotalEstimated(request *models.PurchaseRequest) float64 {
	if request.TotalEstimated != nil {
		return *request.TotalEstimated
	}
	if request.EstimatedPrice != nil {
		return *request.EstimatedPrice * float64(request.Quantity)
	}
	return 0
}
