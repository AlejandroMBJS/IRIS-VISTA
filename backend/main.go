package main

import (
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"vista-backend/config"
	"vista-backend/internal/handlers"
	"vista-backend/internal/middleware"
	"vista-backend/internal/services"
	"vista-backend/internal/services/amazon"
	"vista-backend/internal/services/email"
	"vista-backend/internal/services/metadata"
	"vista-backend/migrations"
	"vista-backend/pkg/crypto"
	"vista-backend/pkg/jwt"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := config.InitDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := migrations.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Seed initial data
	if err := migrations.SeedData(db); err != nil {
		log.Fatalf("Failed to seed data: %v", err)
	}

	// Initialize services
	jwtService := jwt.NewJWTService(cfg.JWT.SecretKey, cfg.JWT.AccessTokenExpiry, cfg.JWT.RefreshTokenExpiry)
	encryptionService, err := crypto.NewEncryptionService(cfg.Crypto.EncryptionKey)
	if err != nil {
		log.Fatalf("Failed to initialize encryption service: %v", err)
	}

	authService := services.NewAuthService(db, jwtService)
	amazonService := amazon.NewAutomationService()
	metadataService := metadata.NewService()
	emailService := email.NewEmailService(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, db)
	userHandler := handlers.NewUserHandler(db)
	productHandler := handlers.NewProductHandler(db)
	requestHandler := handlers.NewRequestHandler(db)
	approvalHandler := handlers.NewApprovalHandler(db, amazonService, encryptionService)
	adminHandler := handlers.NewAdminHandler(db, encryptionService, amazonService)
	purchaseConfigHandler := handlers.NewPurchaseConfigHandler(db, metadataService)
	emailConfigHandler := handlers.NewEmailConfigHandler(db, emailService, encryptionService)
	notificationHandler := handlers.NewNotificationHandler(db)
	uploadHandler := handlers.NewUploadHandler()
	cartHandler := handlers.NewCartHandler(db, metadataService)
	activityLogHandler := handlers.NewActivityLogHandler(db)

	// Setup router
	router := gin.Default()

	// CORS middleware
	corsConfig := middleware.DefaultCORSConfig()
	corsConfig.AllowOrigins = cfg.Server.AllowOrigins
	router.Use(middleware.CORS(corsConfig))

	// Logger and recovery
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
			auth.POST("/refresh", authHandler.Refresh)
		}

		// Auth routes (protected)
		authProtected := v1.Group("/auth")
		authProtected.Use(middleware.Auth(jwtService))
		{
			authProtected.POST("/logout", authHandler.Logout)
			authProtected.GET("/me", authHandler.Me)
		}

		// User routes (admin only)
		users := v1.Group("/users")
		users.Use(middleware.Auth(jwtService))
		users.Use(middleware.RequireAdmin())
		{
			users.GET("", userHandler.ListUsers)
			users.GET("/pending", userHandler.ListPendingUsers)
			users.GET("/pending/count", userHandler.GetPendingUsersCount)
			users.GET("/:id", userHandler.GetUser)
			users.POST("", userHandler.CreateUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
			users.PATCH("/:id/toggle", userHandler.ToggleUserStatus)
			users.POST("/:id/approve", userHandler.ApproveUser)
			users.POST("/:id/reject", userHandler.RejectUser)
		}

		// User self-service routes
		profile := v1.Group("/profile")
		profile.Use(middleware.Auth(jwtService))
		{
			profile.PUT("/password", userHandler.ChangePassword)
		}

		// Product routes (all authenticated users)
		products := v1.Group("/products")
		products.Use(middleware.Auth(jwtService))
		{
			products.GET("", productHandler.ListProducts)
			products.GET("/categories", productHandler.GetCategories)
			products.GET("/:id", productHandler.GetProduct)
		}

		// Product management routes (admin/supply chain)
		productsMgmt := v1.Group("/products")
		productsMgmt.Use(middleware.Auth(jwtService))
		productsMgmt.Use(middleware.RequireAdminOrSupplyChain())
		{
			productsMgmt.POST("", productHandler.CreateProduct)
			productsMgmt.PUT("/:id", productHandler.UpdateProduct)
			productsMgmt.DELETE("/:id", productHandler.DeleteProduct)
			productsMgmt.PATCH("/:id/stock", productHandler.UpdateStock)
		}

		// Purchase request routes (all authenticated users)
		requests := v1.Group("/purchase-requests")
		requests.Use(middleware.Auth(jwtService))
		{
			requests.GET("/config", purchaseConfigHandler.GetPublicConfig)
			requests.POST("/extract-metadata", requestHandler.ExtractMetadata)
			requests.POST("", requestHandler.CreateRequest)
			requests.GET("/my", requestHandler.GetMyRequests)
			requests.GET("/:id", requestHandler.GetRequest)
			requests.PUT("/:id", requestHandler.UpdateRequest)
			requests.DELETE("/:id", requestHandler.CancelRequest)
		}

		// Cart routes (all authenticated users)
		cart := v1.Group("/cart")
		cart.Use(middleware.Auth(jwtService))
		{
			cart.GET("", cartHandler.GetCart)
			cart.GET("/count", cartHandler.GetCartCount)
			cart.POST("", cartHandler.AddToCart)
			cart.PUT("/:id", cartHandler.UpdateCartItem)
			cart.DELETE("/:id", cartHandler.RemoveFromCart)
			cart.DELETE("", cartHandler.ClearCart)
		}

		// All requests route (for admin/gm/scm)
		allRequests := v1.Group("/requests")
		allRequests.Use(middleware.Auth(jwtService))
		allRequests.Use(middleware.CanViewAllRequests())
		{
			allRequests.GET("", requestHandler.ListRequests)
		}

		// Approval routes - View (GM + Admin can view)
		approvalsView := v1.Group("/approvals")
		approvalsView.Use(middleware.Auth(jwtService))
		approvalsView.Use(middleware.RequireCanViewApprovals())
		{
			approvalsView.GET("", approvalHandler.ListPendingApprovals)
			approvalsView.GET("/stats", approvalHandler.GetApprovalStats)
			approvalsView.GET("/:id", approvalHandler.GetApprovalDetails)
		}

		// Approval routes - Actions (Only GM can approve/reject)
		approvalsAction := v1.Group("/approvals")
		approvalsAction.Use(middleware.Auth(jwtService))
		approvalsAction.Use(middleware.RequireApprover())
		{
			approvalsAction.POST("/:id/approve", approvalHandler.ApproveRequest)
			approvalsAction.POST("/:id/reject", approvalHandler.RejectRequest)
			approvalsAction.POST("/:id/request-info", approvalHandler.RequestInfo)
		}

		// Admin routes - System administration (Admin only)
		admin := v1.Group("/admin")
		admin.Use(middleware.Auth(jwtService))
		admin.Use(middleware.RequireAdmin())
		{
			admin.GET("/dashboard", adminHandler.GetDashboardStats)

			// Amazon config (legacy)
			admin.GET("/amazon/config", adminHandler.GetAmazonConfig)
			admin.PUT("/amazon/config", adminHandler.SaveAmazonConfig)
			admin.POST("/amazon/test", adminHandler.TestAmazonConnection)
			admin.GET("/amazon/session", adminHandler.GetAmazonSessionStatus)
		}

		// Purchase config routes (Admin + PurchaseAdmin)
		purchaseConfig := v1.Group("/admin")
		purchaseConfig.Use(middleware.Auth(jwtService))
		purchaseConfig.Use(middleware.RequirePurchaseConfig())
		{
			purchaseConfig.GET("/purchase-config", purchaseConfigHandler.GetPurchaseConfig)
			purchaseConfig.PUT("/purchase-config", purchaseConfigHandler.SavePurchaseConfig)
			purchaseConfig.POST("/purchase-config/test", purchaseConfigHandler.TestMetadataExtraction)
			purchaseConfig.GET("/purchase-config/users", purchaseConfigHandler.GetApprovers)
		}

		// Email config routes (Admin only)
		emailConfig := v1.Group("/admin")
		emailConfig.Use(middleware.Auth(jwtService))
		emailConfig.Use(middleware.RequireAdmin())
		{
			emailConfig.GET("/email-config", emailConfigHandler.GetEmailConfig)
			emailConfig.PUT("/email-config", emailConfigHandler.SaveEmailConfig)
			emailConfig.POST("/email-config/test", emailConfigHandler.TestEmailConfig)
		}

		// Activity logs routes (Admin only)
		activityLogs := v1.Group("/admin/activity-logs")
		activityLogs.Use(middleware.Auth(jwtService))
		activityLogs.Use(middleware.RequireAdmin())
		{
			activityLogs.GET("", activityLogHandler.GetActivityLogs)
			activityLogs.GET("/stats", activityLogHandler.GetActivityStats)
			activityLogs.GET("/sessions", activityLogHandler.GetActiveSessions)
			activityLogs.DELETE("/sessions/:id", activityLogHandler.EndSession)
		}

		// Approved orders management (Admin + PurchaseAdmin)
		orders := v1.Group("/admin")
		orders.Use(middleware.Auth(jwtService))
		orders.Use(middleware.RequirePurchaseManager())
		{
			orders.GET("/approved-orders", adminHandler.GetApprovedOrders)
			orders.PATCH("/orders/:id/purchased", adminHandler.MarkAsPurchased)
			orders.POST("/orders/:id/retry-cart", adminHandler.RetryAddToCart)
			orders.PATCH("/orders/:id/notes", adminHandler.UpdateOrderNotes)
		}

		// Upload routes (admin/supply chain)
		upload := v1.Group("/upload")
		upload.Use(middleware.Auth(jwtService))
		upload.Use(middleware.RequireAdminOrSupplyChain())
		{
			upload.GET("/requirements", uploadHandler.GetUploadRequirements)
			upload.POST("/image", uploadHandler.UploadImage)
			upload.POST("/images", uploadHandler.UploadImages)
			upload.DELETE("/image", uploadHandler.DeleteImage)
		}

		// Notification routes (all authenticated users)
		notifications := v1.Group("/notifications")
		notifications.Use(middleware.Auth(jwtService))
		{
			notifications.GET("", notificationHandler.ListNotifications)
			notifications.GET("/count", notificationHandler.GetNotificationCount)
			notifications.GET("/pending-counts", notificationHandler.GetPendingCounts)
			notifications.PATCH("/:id/read", notificationHandler.MarkAsRead)
			notifications.POST("/read-all", notificationHandler.MarkAllAsRead)
		}
	}

	// Serve uploaded files (with cache headers)
	router.Static("/uploads", "./uploads")

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Debug: Test metadata extraction (no auth required)
	router.POST("/debug/extract-metadata", func(c *gin.Context) {
		var input struct {
			URL string `json:"url" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		meta, err := metadataService.Extract(input.URL)
		if err != nil {
			c.JSON(200, gin.H{
				"error":    err.Error(),
				"url":      input.URL,
				"metadata": nil,
			})
			return
		}
		c.JSON(200, gin.H{
			"error":    nil,
			"url":      input.URL,
			"metadata": meta,
		})
	})

	// Debug: Get raw HTML from URL to see what we're receiving
	router.POST("/debug/fetch-html", func(c *gin.Context) {
		var input struct {
			URL string `json:"url" binding:"required"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		client := &http.Client{Timeout: 15 * time.Second}
		req, _ := http.NewRequest("GET", input.URL, nil)
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")
		req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
		req.Header.Set("Accept-Language", "es-MX,es;q=0.9,en;q=0.8")

		resp, err := client.Do(req)
		if err != nil {
			c.JSON(200, gin.H{"error": err.Error(), "html": ""})
			return
		}
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		htmlStr := string(body)

		// Return first 5000 chars to see what we get
		if len(htmlStr) > 5000 {
			htmlStr = htmlStr[:5000]
		}

		c.JSON(200, gin.H{
			"status_code": resp.StatusCode,
			"html_length": len(body),
			"html_preview": htmlStr,
		})
	})

	// Start server
	log.Printf("Server starting on port %s...", cfg.Server.Port)
	log.Printf("Environment: %s", cfg.Server.Environment)
	log.Printf("CORS Origins: %v", cfg.Server.AllowOrigins)

	if err := router.Run(":" + cfg.Server.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
