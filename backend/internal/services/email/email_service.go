package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"time"

	"gorm.io/gorm"
	"vista-backend/internal/models"
)

// EmailService handles sending emails via Resend
type EmailService struct {
	db *gorm.DB
}

// NewEmailService creates a new email service
func NewEmailService(db *gorm.DB) *EmailService {
	return &EmailService{db: db}
}

// ResendRequest represents the Resend API request body
type ResendRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	ReplyTo string   `json:"reply_to,omitempty"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text,omitempty"`
}

// ResendResponse represents the Resend API response
type ResendResponse struct {
	ID      string `json:"id,omitempty"`
	Message string `json:"message,omitempty"`
}

// getConfig retrieves the email configuration
func (s *EmailService) getConfig() (*models.EmailConfig, error) {
	var config models.EmailConfig
	if err := s.db.First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}

// SendEmail sends an email using the configured provider
func (s *EmailService) SendEmail(to []string, subject, htmlBody, textBody string) error {
	config, err := s.getConfig()
	if err != nil {
		return fmt.Errorf("failed to get email config: %w", err)
	}

	if config == nil || !config.CanSendEmail() {
		return fmt.Errorf("email service not configured")
	}

	switch config.Provider {
	case "resend":
		return s.sendViaResend(config, to, subject, htmlBody, textBody)
	default:
		return fmt.Errorf("unsupported email provider: %s", config.Provider)
	}
}

// sendViaResend sends email using Resend API
func (s *EmailService) sendViaResend(config *models.EmailConfig, to []string, subject, htmlBody, textBody string) error {
	fromAddress := config.FromEmail
	if config.FromName != "" {
		fromAddress = fmt.Sprintf("%s <%s>", config.FromName, config.FromEmail)
	}

	req := ResendRequest{
		From:    fromAddress,
		To:      to,
		Subject: subject,
		HTML:    htmlBody,
		Text:    textBody,
	}

	if config.ReplyToEmail != "" {
		req.ReplyTo = config.ReplyToEmail
	}

	jsonData, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+config.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	var resendResp ResendResponse
	if err := json.NewDecoder(resp.Body).Decode(&resendResp); err != nil {
		return fmt.Errorf("failed to decode response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API error: %s", resendResp.Message)
	}

	return nil
}

// TestConnection tests the email connection by sending a test email
func (s *EmailService) TestConnection(testEmail string) error {
	config, err := s.getConfig()
	if err != nil {
		return fmt.Errorf("failed to get email config: %w", err)
	}

	if config == nil {
		return fmt.Errorf("email configuration not found")
	}

	if config.APIKey == "" {
		return fmt.Errorf("API key not configured")
	}

	if config.FromEmail == "" {
		return fmt.Errorf("from email not configured")
	}

	subject := "IRIS Vista - Email Test"
	htmlBody := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #75534B, #5D423C); padding: 20px; border-radius: 8px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 20px 0; }
        .success { color: #22c55e; font-weight: 600; }
        .footer { color: #6b7280; font-size: 12px; text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IRIS Vista</h1>
        </div>
        <div class="content">
            <p class="success">Email configuration is working correctly!</p>
            <p>This is a test email from IRIS Vista to verify your email configuration.</p>
            <p>If you received this email, your Resend integration is properly configured.</p>
        </div>
        <div class="footer">
            <p>IRIS Vista - Supply Chain & Procurement</p>
        </div>
    </div>
</body>
</html>
`
	textBody := "IRIS Vista Email Test\n\nEmail configuration is working correctly!\n\nThis is a test email from IRIS Vista to verify your email configuration."

	return s.sendViaResend(config, []string{testEmail}, subject, htmlBody, textBody)
}

// Email templates for notifications

// SendRequestApprovedEmail sends notification when a request is approved
func (s *EmailService) SendRequestApprovedEmail(user *models.User, request *models.PurchaseRequest) error {
	config, err := s.getConfig()
	if err != nil || config == nil || !config.CanSendEmail() || !config.SendOnApproval {
		return nil // Silently skip if not configured
	}

	subject := fmt.Sprintf("Solicitud #%s Aprobada - IRIS Vista", request.RequestNumber)
	htmlBody := s.buildApprovalEmail(request, user.Name)

	return s.SendEmail([]string{user.Email}, subject, htmlBody, "")
}

// SendRequestRejectedEmail sends notification when a request is rejected
func (s *EmailService) SendRequestRejectedEmail(user *models.User, request *models.PurchaseRequest, reason string) error {
	config, err := s.getConfig()
	if err != nil || config == nil || !config.CanSendEmail() || !config.SendOnRejection {
		return nil
	}

	subject := fmt.Sprintf("Solicitud #%s Rechazada - IRIS Vista", request.RequestNumber)
	htmlBody := s.buildRejectionEmail(request, user.Name, reason)

	return s.SendEmail([]string{user.Email}, subject, htmlBody, "")
}

// SendRequestInfoRequiredEmail sends notification when more info is needed
func (s *EmailService) SendRequestInfoRequiredEmail(user *models.User, request *models.PurchaseRequest, note string) error {
	config, err := s.getConfig()
	if err != nil || config == nil || !config.CanSendEmail() || !config.SendOnInfoRequest {
		return nil
	}

	subject := fmt.Sprintf("Información Requerida para #%s - IRIS Vista", request.RequestNumber)
	htmlBody := s.buildInfoRequestEmail(request, user.Name, note)

	return s.SendEmail([]string{user.Email}, subject, htmlBody, "")
}

// SendNewRequestEmail sends notification to approvers when a new request is created
func (s *EmailService) SendNewRequestEmail(approvers []models.User, request *models.PurchaseRequest, isUrgent bool) error {
	config, err := s.getConfig()
	if err != nil || config == nil || !config.CanSendEmail() {
		return nil
	}

	if isUrgent && !config.SendOnUrgent {
		return nil
	}
	if !isUrgent && !config.SendOnNewRequest {
		return nil
	}

	subject := fmt.Sprintf("Nueva Solicitud #%s - IRIS Vista", request.RequestNumber)
	if isUrgent {
		subject = fmt.Sprintf("[URGENTE] Nueva Solicitud #%s - IRIS Vista", request.RequestNumber)
	}

	for _, approver := range approvers {
		htmlBody := s.buildNewRequestEmail(request, approver.Name, isUrgent)
		if err := s.SendEmail([]string{approver.Email}, subject, htmlBody, ""); err != nil {
			// Log but don't fail on individual email errors
			continue
		}
	}

	return nil
}

// SendOrderPurchasedEmail sends notification when an order is marked as purchased
func (s *EmailService) SendOrderPurchasedEmail(user *models.User, request *models.PurchaseRequest) error {
	config, err := s.getConfig()
	if err != nil || config == nil || !config.CanSendEmail() || !config.SendOnPurchased {
		return nil
	}

	subject := fmt.Sprintf("Pedido #%s Completado - IRIS Vista", request.RequestNumber)
	htmlBody := s.buildPurchasedEmail(request, user.Name)

	return s.SendEmail([]string{user.Email}, subject, htmlBody, "")
}

// Template builders

func (s *EmailService) buildApprovalEmail(request *models.PurchaseRequest, userName string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #75534B, #5D423C); padding: 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; }
        .content { padding: 24px; }
        .status { background: #dcfce7; color: #166534; padding: 12px 16px; border-radius: 8px; font-weight: 600; margin-bottom: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .detail-label { color: #6b7280; }
        .detail-value { color: #111827; font-weight: 500; }
        .btn { display: inline-block; background: #75534B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { color: #9ca3af; font-size: 12px; text-align: center; padding: 16px; background: #f9fafb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IRIS Vista</h1>
        </div>
        <div class="content">
            <p>Hola {{.UserName}},</p>
            <div class="status">Tu solicitud de compra ha sido aprobada</div>
            <div class="detail-row">
                <span class="detail-label">Número de solicitud</span>
                <span class="detail-value">{{.RequestNumber}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Producto</span>
                <span class="detail-value">{{.ProductTitle}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cantidad</span>
                <span class="detail-value">{{.Quantity}}</span>
            </div>
            <p>Tu solicitud está ahora lista para ser procesada por el equipo de compras.</p>
            <a href="{{.ActionURL}}" class="btn">Ver Solicitud</a>
        </div>
        <div class="footer">
            <p>IRIS Vista - Supply Chain & Procurement</p>
        </div>
    </div>
</body>
</html>
`
	return s.renderTemplate(tmpl, map[string]interface{}{
		"UserName":      userName,
		"RequestNumber": request.RequestNumber,
		"ProductTitle":  request.ProductTitle,
		"Quantity":      request.Quantity,
		"ActionURL":     fmt.Sprintf("/requests?id=%d", request.ID),
	})
}

func (s *EmailService) buildRejectionEmail(request *models.PurchaseRequest, userName, reason string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #75534B, #5D423C); padding: 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; }
        .content { padding: 24px; }
        .status { background: #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 8px; font-weight: 600; margin-bottom: 20px; }
        .reason { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .reason-label { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
        .reason-text { color: #111827; }
        .btn { display: inline-block; background: #75534B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { color: #9ca3af; font-size: 12px; text-align: center; padding: 16px; background: #f9fafb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IRIS Vista</h1>
        </div>
        <div class="content">
            <p>Hola {{.UserName}},</p>
            <div class="status">Tu solicitud de compra ha sido rechazada</div>
            <p><strong>Solicitud #{{.RequestNumber}}</strong>: {{.ProductTitle}}</p>
            <div class="reason">
                <div class="reason-label">Motivo del rechazo</div>
                <div class="reason-text">{{.Reason}}</div>
            </div>
            <p>Si tienes preguntas sobre esta decisión, contacta a tu gerente.</p>
            <a href="{{.ActionURL}}" class="btn">Ver Solicitud</a>
        </div>
        <div class="footer">
            <p>IRIS Vista - Supply Chain & Procurement</p>
        </div>
    </div>
</body>
</html>
`
	return s.renderTemplate(tmpl, map[string]interface{}{
		"UserName":      userName,
		"RequestNumber": request.RequestNumber,
		"ProductTitle":  request.ProductTitle,
		"Reason":        reason,
		"ActionURL":     fmt.Sprintf("/requests?id=%d", request.ID),
	})
}

func (s *EmailService) buildInfoRequestEmail(request *models.PurchaseRequest, userName, note string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #75534B, #5D423C); padding: 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; }
        .content { padding: 24px; }
        .status { background: #fef3c7; color: #92400e; padding: 12px 16px; border-radius: 8px; font-weight: 600; margin-bottom: 20px; }
        .note { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .note-label { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
        .note-text { color: #111827; }
        .btn { display: inline-block; background: #75534B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { color: #9ca3af; font-size: 12px; text-align: center; padding: 16px; background: #f9fafb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IRIS Vista</h1>
        </div>
        <div class="content">
            <p>Hola {{.UserName}},</p>
            <div class="status">Se requiere información adicional</div>
            <p><strong>Solicitud #{{.RequestNumber}}</strong>: {{.ProductTitle}}</p>
            <div class="note">
                <div class="note-label">Información solicitada</div>
                <div class="note-text">{{.Note}}</div>
            </div>
            <p>Por favor, actualiza tu solicitud con la información requerida.</p>
            <a href="{{.ActionURL}}" class="btn">Actualizar Solicitud</a>
        </div>
        <div class="footer">
            <p>IRIS Vista - Supply Chain & Procurement</p>
        </div>
    </div>
</body>
</html>
`
	return s.renderTemplate(tmpl, map[string]interface{}{
		"UserName":      userName,
		"RequestNumber": request.RequestNumber,
		"ProductTitle":  request.ProductTitle,
		"Note":          note,
		"ActionURL":     fmt.Sprintf("/requests?id=%d", request.ID),
	})
}

func (s *EmailService) buildNewRequestEmail(request *models.PurchaseRequest, approverName string, isUrgent bool) string {
	urgentBadge := ""
	if isUrgent {
		urgentBadge = `<span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">URGENTE</span>`
	}

	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #75534B, #5D423C); padding: 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; }
        .content { padding: 24px; }
        .status { background: #dbeafe; color: #1e40af; padding: 12px 16px; border-radius: 8px; font-weight: 600; margin-bottom: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .detail-label { color: #6b7280; }
        .detail-value { color: #111827; font-weight: 500; }
        .btn { display: inline-block; background: #75534B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { color: #9ca3af; font-size: 12px; text-align: center; padding: 16px; background: #f9fafb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IRIS Vista</h1>
        </div>
        <div class="content">
            <p>Hola {{.ApproverName}},</p>
            <div class="status">Nueva solicitud pendiente de aprobación {{.UrgentBadge}}</div>
            <div class="detail-row">
                <span class="detail-label">Número de solicitud</span>
                <span class="detail-value">{{.RequestNumber}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Solicitante</span>
                <span class="detail-value">{{.RequesterName}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Producto</span>
                <span class="detail-value">{{.ProductTitle}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cantidad</span>
                <span class="detail-value">{{.Quantity}}</span>
            </div>
            <p>Por favor, revisa y procesa esta solicitud.</p>
            <a href="{{.ActionURL}}" class="btn">Revisar Solicitud</a>
        </div>
        <div class="footer">
            <p>IRIS Vista - Supply Chain & Procurement</p>
        </div>
    </div>
</body>
</html>
`
	requesterName := ""
	if request.Requester.ID != 0 {
		requesterName = request.Requester.Name
	}

	return s.renderTemplate(tmpl, map[string]interface{}{
		"ApproverName":  approverName,
		"RequestNumber": request.RequestNumber,
		"RequesterName": requesterName,
		"ProductTitle":  request.ProductTitle,
		"Quantity":      request.Quantity,
		"UrgentBadge":   template.HTML(urgentBadge),
		"ActionURL":     fmt.Sprintf("/approvals?id=%d", request.ID),
	})
}

func (s *EmailService) buildPurchasedEmail(request *models.PurchaseRequest, userName string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #75534B, #5D423C); padding: 24px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 20px; }
        .content { padding: 24px; }
        .status { background: #d1fae5; color: #065f46; padding: 12px 16px; border-radius: 8px; font-weight: 600; margin-bottom: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .detail-label { color: #6b7280; }
        .detail-value { color: #111827; font-weight: 500; }
        .btn { display: inline-block; background: #75534B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { color: #9ca3af; font-size: 12px; text-align: center; padding: 16px; background: #f9fafb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IRIS Vista</h1>
        </div>
        <div class="content">
            <p>Hola {{.UserName}},</p>
            <div class="status">Tu pedido ha sido completado</div>
            <div class="detail-row">
                <span class="detail-label">Número de solicitud</span>
                <span class="detail-value">{{.RequestNumber}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Producto</span>
                <span class="detail-value">{{.ProductTitle}}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Cantidad</span>
                <span class="detail-value">{{.Quantity}}</span>
            </div>
            <p>El equipo de compras ha procesado tu pedido exitosamente.</p>
            <a href="{{.ActionURL}}" class="btn">Ver Detalles</a>
        </div>
        <div class="footer">
            <p>IRIS Vista - Supply Chain & Procurement</p>
        </div>
    </div>
</body>
</html>
`
	return s.renderTemplate(tmpl, map[string]interface{}{
		"UserName":      userName,
		"RequestNumber": request.RequestNumber,
		"ProductTitle":  request.ProductTitle,
		"Quantity":      request.Quantity,
		"ActionURL":     fmt.Sprintf("/requests?id=%d", request.ID),
	})
}

func (s *EmailService) renderTemplate(tmplStr string, data map[string]interface{}) string {
	tmpl, err := template.New("email").Parse(tmplStr)
	if err != nil {
		return ""
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return ""
	}

	return buf.String()
}
