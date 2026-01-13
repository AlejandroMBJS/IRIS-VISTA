package migrations

import (
	"log"

	"gorm.io/gorm"
	"vista-backend/internal/models"
	"vista-backend/internal/services"
)

// RunMigrations runs all database migrations
func RunMigrations(db *gorm.DB) error {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.ProductImage{},
		&models.PurchaseRequest{},
		&models.PurchaseRequestItem{},
		&models.RequestHistory{},
		&models.Notification{},
		&models.AmazonConfig{},
		&models.PurchaseConfig{},
		&models.EmailConfig{},
		&models.AuditLog{},
		&models.CartItem{},
		&models.ActivityLog{},
	)
	if err != nil {
		return err
	}

	log.Println("Database migrations completed successfully")
	return nil
}

// SeedData seeds initial data into the database
func SeedData(db *gorm.DB) error {
	log.Println("Seeding initial data...")

	// Check if admin user exists by employee_number
	var adminCount int64
	db.Model(&models.User{}).Where("employee_number = ?", "admin").Count(&adminCount)
	if adminCount == 0 {
		// Check for legacy admin (by role only)
		var legacyAdmin models.User
		if err := db.Where("role = ?", models.RoleAdmin).First(&legacyAdmin).Error; err == nil {
			// Update legacy admin with employee_number and new status
			legacyAdmin.EmployeeNumber = "admin"
			legacyAdmin.Status = models.UserStatusApproved
			db.Save(&legacyAdmin)
			log.Println("Updated legacy admin with employee_number: admin")
		} else {
			// Create default admin user
			hashedPassword, err := services.HashPassword("admin123")
			if err != nil {
				return err
			}

			admin := models.User{
				EmployeeNumber: "admin",
				Email:          "admin@company.com",
				PasswordHash:   hashedPassword,
				Name:           "System Admin",
				Role:           models.RoleAdmin,
				CompanyCode:    "CC-001",
				CostCenter:     "CC-ADMIN",
				Department:     "IT",
				Status:         models.UserStatusApproved,
			}
			if err := db.Create(&admin).Error; err != nil {
				return err
			}
			log.Println("Created default admin user: employee_number=admin, password=admin123")
		}
	}

	// NOTE: Sample users removed for production readiness
	// All new users must register and be approved by admin

	// Seed products from Amazon order history (products ordered more than once)
	// This replaces the old sample products
	var productCount int64
	db.Model(&models.Product{}).Count(&productCount)
	if productCount == 0 {
		seedAmazonProducts(db)
	}

	// Seed PurchaseConfig (singleton)
	var purchaseConfigCount int64
	db.Model(&models.PurchaseConfig{}).Count(&purchaseConfigCount)
	if purchaseConfigCount == 0 {
		config := models.GetDefaultPurchaseConfig()
		db.Create(&config)
		log.Println("Created default purchase configuration")
	}

	log.Println("Database seeding completed successfully")
	return nil
}

func mustHash(password string) string {
	hash, err := services.HashPassword(password)
	if err != nil {
		panic(err)
	}
	return hash
}

// seedAmazonProducts seeds products from Amazon order history (ordered more than once)
func seedAmazonProducts(db *gorm.DB) {
	products := []models.Product{
		{SKU: "AMZ-B0BWK6PXZX", Name: "Reynera Kit de Limpieza Profesional con Escoba Doble Angular y Recogedor", Category: "Kitchen", Brand: "Reynera", Price: 309.48, Currency: "MXN", ASIN: "B0BWK6PXZX", ProductURL: "https://www.amazon.com.mx/dp/B0BWK6PXZX", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0984QSDS8", Name: "BIC Bolígrafo BU3 Medium Point 1.00 mm Retráctil 3 Piezas Negro", Category: "Office Product", Brand: "BIC", Price: 20.6, Currency: "MXN", ASIN: "B0984QSDS8", ProductURL: "https://www.amazon.com.mx/dp/B0984QSDS8", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CRZH1K9G", Name: "Best Trading 100 Guantes de Nitrilo Color Negro Talla Mediano", Category: "Ropa", Brand: "Best Trading", Price: 137.92, Currency: "MXN", ASIN: "B0CRZH1K9G", ProductURL: "https://www.amazon.com.mx/dp/B0CRZH1K9G", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0BSHF7WY2", Name: "Amazon Basics Paquete de 24 pilas recargables AA", Category: "Electronics", Brand: "Amazon Basics", Price: 0, Currency: "MXN", ASIN: "B0BSHF7WY2", ProductURL: "https://www.amazon.com.mx/dp/B0BSHF7WY2", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0BWZ55K8J", Name: "Mosley Paños de Limpieza de Microfibra Reutilizables 10 piezas", Category: "Kitchen", Brand: "Mosley", Price: 193.19, Currency: "MXN", ASIN: "B0BWZ55K8J", ProductURL: "https://www.amazon.com.mx/dp/B0BWZ55K8J", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0BSHD9GSR", Name: "Amazon Basics Paquete de 16 pilas recargables AAA", Category: "Electronics", Brand: "Amazon Basics", Price: 0, Currency: "MXN", ASIN: "B0BSHD9GSR", ProductURL: "https://www.amazon.com.mx/dp/B0BSHD9GSR", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0868XKYNF", Name: "Blasón Café Molido Gourmet Americano 1 kg", Category: "Grocery", Brand: "Blason", Price: 339.0, Currency: "MXN", ASIN: "B0868XKYNF", ProductURL: "https://www.amazon.com.mx/dp/B0868XKYNF", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B07NQ2MDP5", Name: "Amazon Basics Pilas alcalinas AAA de alto rendimiento 36 unidades", Category: "Electronics", Brand: "Amazon Basics", Price: 0, Currency: "MXN", ASIN: "B07NQ2MDP5", ProductURL: "https://www.amazon.com.mx/dp/B07NQ2MDP5", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0C7BN8G94", Name: "BIC Bolígrafo Cristal Fashion Punto Grueso 1.2mm 10 piezas", Category: "Office Product", Brand: "BIC", Price: 0, Currency: "MXN", ASIN: "B0C7BN8G94", ProductURL: "https://www.amazon.com.mx/dp/B0C7BN8G94", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B09FPKQ3WD", Name: "Amazon Basics Cargador de pilas de 4 ranuras USB", Category: "Electronics", Brand: "Amazon Basics", Price: 0, Currency: "MXN", ASIN: "B09FPKQ3WD", ProductURL: "https://www.amazon.com.mx/dp/B09FPKQ3WD", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0BWWSMV2V", Name: "Aurrera Bolsa Negra para Basura Extra Grande 90 x 120 cm 10 pzs", Category: "Health and Beauty", Brand: "Aurrera", Price: 49.0, Currency: "MXN", ASIN: "B0BWWSMV2V", ProductURL: "https://www.amazon.com.mx/dp/B0BWWSMV2V", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D5SWS3DV", Name: "Cloralex Cloro 950 ml", Category: "Grocery", Brand: "Cloralex", Price: 19.5, Currency: "MXN", ASIN: "B0D5SWS3DV", ProductURL: "https://www.amazon.com.mx/dp/B0D5SWS3DV", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0DJ95C7DD", Name: "Huggies Toallitas húmedas One & Done 336 piezas", Category: "Baby Product", Brand: "Huggies", Price: 241.0, Currency: "MXN", ASIN: "B0DJ95C7DD", ProductURL: "https://www.amazon.com.mx/dp/B0DJ95C7DD", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B089K5VFVZ", Name: "Salvo Lavatrastes Líquido Limón 750 ml", Category: "Health and Beauty", Brand: "Salvo", Price: 48.5, Currency: "MXN", ASIN: "B089K5VFVZ", ProductURL: "https://www.amazon.com.mx/dp/B089K5VFVZ", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D5SYN8JQ", Name: "Fabuloso Limpiador Multiusos Lavanda 1L", Category: "Health and Beauty", Brand: "Fabuloso", Price: 29.0, Currency: "MXN", ASIN: "B0D5SYN8JQ", ProductURL: "https://www.amazon.com.mx/dp/B0D5SYN8JQ", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D11L13N5", Name: "ECKO Escoba Grande Palmira", Category: "Kitchen", Brand: "ECKO", Price: 54.5, Currency: "MXN", ASIN: "B0D11L13N5", ProductURL: "https://www.amazon.com.mx/dp/B0D11L13N5", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B07H9DTJD5", Name: "Command Tiras para Colgar Medianas 3M", Category: "Tools & Home Improvement", Brand: "Command", Price: 138.0, Currency: "MXN", ASIN: "B07H9DTJD5", ProductURL: "https://www.amazon.com.mx/dp/B07H9DTJD5", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D5SWHR2S", Name: "Fabuloso Limpiador Antibacterial Lavanda 1L", Category: "Health and Beauty", Brand: "Fabuloso", Price: 37.0, Currency: "MXN", ASIN: "B0D5SWHR2S", ProductURL: "https://www.amazon.com.mx/dp/B0D5SWHR2S", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CT9H32KP", Name: "Zest Jabón Líquido para Manos Naranja 1L", Category: "Health and Beauty", Brand: "Zest", Price: 48.5, Currency: "MXN", ASIN: "B0CT9H32KP", ProductURL: "https://www.amazon.com.mx/dp/B0CT9H32KP", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CYHQVZZ5", Name: "Pritt Pegamento en Barra Original 42g Pack 3", Category: "Office Product", Brand: "Pritt", Price: 104.0, Currency: "MXN", ASIN: "B0CYHQVZZ5", ProductURL: "https://www.amazon.com.mx/dp/B0CYHQVZZ5", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D5SWRMCP", Name: "Pinol Limpiador Original 1L", Category: "Health and Beauty", Brand: "Pinol", Price: 37.5, Currency: "MXN", ASIN: "B0D5SWRMCP", ProductURL: "https://www.amazon.com.mx/dp/B0D5SWRMCP", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B09L9HCM92", Name: "Regio Rinde+ Toallas de papel 250 hojas", Category: "Health and Beauty", Brand: "Regio", Price: 25.0, Currency: "MXN", ASIN: "B09L9HCM92", ProductURL: "https://www.amazon.com.mx/dp/B09L9HCM92", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B09L9L7HQ2", Name: "Regio Papel Higiénico Rinde+ 12 rollos", Category: "Health and Beauty", Brand: "Regio", Price: 68.5, Currency: "MXN", ASIN: "B09L9L7HQ2", ProductURL: "https://www.amazon.com.mx/dp/B09L9L7HQ2", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B09NNR6S8P", Name: "Truper Recogedor de basura 31x26 cm", Category: "Lawn & Garden", Brand: "Truper", Price: 68.0, Currency: "MXN", ASIN: "B09NNR6S8P", ProductURL: "https://www.amazon.com.mx/dp/B09NNR6S8P", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B07FQBXQ1C", Name: "CRC WD-40 Lubricante Multiusos 311g", Category: "Tools & Home Improvement", Brand: "CRC", Price: 137.0, Currency: "MXN", ASIN: "B07FQBXQ1C", ProductURL: "https://www.amazon.com.mx/dp/B07FQBXQ1C", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0B91BBYHT", Name: "Command Ganchos Transparentes Pequeños 3M", Category: "Tools & Home Improvement", Brand: "Command", Price: 78.0, Currency: "MXN", ASIN: "B0B91BBYHT", ProductURL: "https://www.amazon.com.mx/dp/B0B91BBYHT", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CW12XGQY", Name: "Papelera Bote de Basura con Pedal 12L", Category: "Kitchen", Brand: "Papelera", Price: 199.0, Currency: "MXN", ASIN: "B0CW12XGQY", ProductURL: "https://www.amazon.com.mx/dp/B0CW12XGQY", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B08L3XFWMN", Name: "BIC Plumón Highlighting Grip Pastel 5 piezas", Category: "Office Product", Brand: "BIC", Price: 75.0, Currency: "MXN", ASIN: "B08L3XFWMN", ProductURL: "https://www.amazon.com.mx/dp/B08L3XFWMN", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0B2JGMNNM", Name: "TP-Link Adaptador USB WiFi 6 AX1800", Category: "Electronics", Brand: "TP-Link", Price: 569.0, Currency: "MXN", ASIN: "B0B2JGMNNM", ProductURL: "https://www.amazon.com.mx/dp/B0B2JGMNNM", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CY89QQQJ", Name: "BOMEI PACK Nano Cinta Adhesiva Doble Cara 3cm x 5m", Category: "Office Product", Brand: "BOMEI PACK", Price: 269.99, Currency: "MXN", ASIN: "B0CY89QQQJ", ProductURL: "https://www.amazon.com.mx/dp/B0CY89QQQJ", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CX8RBD32", Name: "Aurrera Guante Multiusos Talla Grande", Category: "Health and Beauty", Brand: "Aurrera", Price: 21.0, Currency: "MXN", ASIN: "B0CX8RBD32", ProductURL: "https://www.amazon.com.mx/dp/B0CX8RBD32", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D5SWHG2Y", Name: "Pinol Limpiador Floral 1L", Category: "Health and Beauty", Brand: "Pinol", Price: 37.5, Currency: "MXN", ASIN: "B0D5SWHG2Y", ProductURL: "https://www.amazon.com.mx/dp/B0D5SWHG2Y", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CP6QGTF8", Name: "Tramontina Machete Bolo 12 pulgadas", Category: "Tools & Home Improvement", Brand: "Tramontina", Price: 257.0, Currency: "MXN", ASIN: "B0CP6QGTF8", ProductURL: "https://www.amazon.com.mx/dp/B0CP6QGTF8", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B096TLWDMJ", Name: "Amazon Basics Cinta de Embalaje Transparente 6 rollos", Category: "Office Product", Brand: "Amazon Basics", Price: 202.0, Currency: "MXN", ASIN: "B096TLWDMJ", ProductURL: "https://www.amazon.com.mx/dp/B096TLWDMJ", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CYGJLS9T", Name: "Pelikan Tijeras Escolares 13cm", Category: "Office Product", Brand: "Pelikan", Price: 33.0, Currency: "MXN", ASIN: "B0CYGJLS9T", ProductURL: "https://www.amazon.com.mx/dp/B0CYGJLS9T", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0B7QJLWPH", Name: "Great Value Servilletas Blancas 500 piezas", Category: "Health and Beauty", Brand: "Great Value", Price: 59.0, Currency: "MXN", ASIN: "B0B7QJLWPH", ProductURL: "https://www.amazon.com.mx/dp/B0B7QJLWPH", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D9KPGCNR", Name: "Cloralex Cloro Gel 950ml", Category: "Health and Beauty", Brand: "Cloralex", Price: 27.5, Currency: "MXN", ASIN: "B0D9KPGCNR", ProductURL: "https://www.amazon.com.mx/dp/B0D9KPGCNR", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B086MHD3FQ", Name: "Amazon Basics Cable HDMI 4K 1.8m", Category: "Electronics", Brand: "Amazon Basics", Price: 0, Currency: "MXN", ASIN: "B086MHD3FQ", ProductURL: "https://www.amazon.com.mx/dp/B086MHD3FQ", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B084KQPPGZ", Name: "Amazon Basics Hub USB 3.0 de 4 puertos", Category: "Electronics", Brand: "Amazon Basics", Price: 0, Currency: "MXN", ASIN: "B084KQPPGZ", ProductURL: "https://www.amazon.com.mx/dp/B084KQPPGZ", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B07NQBK9F2", Name: "Amazon Basics Pilas alcalinas AA 48 unidades", Category: "Electronics", Brand: "Amazon Basics", Price: 0, Currency: "MXN", ASIN: "B07NQBK9F2", ProductURL: "https://www.amazon.com.mx/dp/B07NQBK9F2", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CQWLNKHX", Name: "Member's Mark Bolsa para basura Extra Grande 24 pzs", Category: "Health and Beauty", Brand: "Member's Mark", Price: 122.0, Currency: "MXN", ASIN: "B0CQWLNKHX", ProductURL: "https://www.amazon.com.mx/dp/B0CQWLNKHX", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CX8LC1FV", Name: "Aurrera Fibra Verde para Trastes 6 pzs", Category: "Kitchen", Brand: "Aurrera", Price: 36.5, Currency: "MXN", ASIN: "B0CX8LC1FV", ProductURL: "https://www.amazon.com.mx/dp/B0CX8LC1FV", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0B12H82K7", Name: "Truper Pala para Jardín con Mango", Category: "Lawn & Garden", Brand: "Truper", Price: 139.0, Currency: "MXN", ASIN: "B0B12H82K7", ProductURL: "https://www.amazon.com.mx/dp/B0B12H82K7", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B07P94DKWZ", Name: "Truper Flexómetro Gripper 5m", Category: "Tools & Home Improvement", Brand: "Truper", Price: 98.0, Currency: "MXN", ASIN: "B07P94DKWZ", ProductURL: "https://www.amazon.com.mx/dp/B07P94DKWZ", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0BRY39MSD", Name: "Escudo Antibacterial Jabón Líquido 450ml", Category: "Health and Beauty", Brand: "Escudo Antibacterial", Price: 47.0, Currency: "MXN", ASIN: "B0BRY39MSD", ProductURL: "https://www.amazon.com.mx/dp/B0BRY39MSD", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B08R2JX5YT", Name: "Aires de Campo Azúcar Orgánica 1kg", Category: "Grocery", Brand: "Aires de Campo", Price: 72.9, Currency: "MXN", ASIN: "B08R2JX5YT", ProductURL: "https://www.amazon.com.mx/dp/B08R2JX5YT", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B09RK2XDH1", Name: "Mapita Cucharas Desechables Grandes 50 pzs", Category: "Kitchen", Brand: "Mapita", Price: 37.0, Currency: "MXN", ASIN: "B09RK2XDH1", ProductURL: "https://www.amazon.com.mx/dp/B09RK2XDH1", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CPMF64BM", Name: "Cinta Canela para Embalaje 48mm x 150m", Category: "Office Product", Brand: "Marca generica", Price: 59.0, Currency: "MXN", ASIN: "B0CPMF64BM", ProductURL: "https://www.amazon.com.mx/dp/B0CPMF64BM", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CX8N2JMV", Name: "Aurrera Jerga para Piso", Category: "Kitchen", Brand: "Aurrera", Price: 30.0, Currency: "MXN", ASIN: "B0CX8N2JMV", ProductURL: "https://www.amazon.com.mx/dp/B0CX8N2JMV", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B09P9GNQJD", Name: "Truper Martillo de Bola 16oz", Category: "Tools & Home Improvement", Brand: "Truper", Price: 179.0, Currency: "MXN", ASIN: "B09P9GNQJD", ProductURL: "https://www.amazon.com.mx/dp/B09P9GNQJD", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CJMHBBVJ", Name: "ECKO Trapeador con Atomizador", Category: "Kitchen", Brand: "ECKO", Price: 299.0, Currency: "MXN", ASIN: "B0CJMHBBVJ", ProductURL: "https://www.amazon.com.mx/dp/B0CJMHBBVJ", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0B38K4JM2", Name: "BIC Marcadores Permanentes Negros 12 pzs", Category: "Office Product", Brand: "BIC", Price: 180.0, Currency: "MXN", ASIN: "B0B38K4JM2", ProductURL: "https://www.amazon.com.mx/dp/B0B38K4JM2", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0DBGWRXT6", Name: "Pilot Pluma de Gel G2 0.5mm Azul 3 pzs", Category: "Office Product", Brand: "Pilot", Price: 68.0, Currency: "MXN", ASIN: "B0DBGWRXT6", ProductURL: "https://www.amazon.com.mx/dp/B0DBGWRXT6", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B07VQ59DDB", Name: "Pretul Cuchara para Albañil", Category: "Tools & Home Improvement", Brand: "Pretul", Price: 64.0, Currency: "MXN", ASIN: "B07VQ59DDB", ProductURL: "https://www.amazon.com.mx/dp/B07VQ59DDB", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D6PWQHK7", Name: "Scotch-Brite Esponja Non-Scratch 3 pzs", Category: "Kitchen", Brand: "Scotch-Brite", Price: 32.0, Currency: "MXN", ASIN: "B0D6PWQHK7", ProductURL: "https://www.amazon.com.mx/dp/B0D6PWQHK7", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CSF9GL4Y", Name: "Vileda Easy Wring Repuesto", Category: "Kitchen", Brand: "Vileda", Price: 169.0, Currency: "MXN", ASIN: "B0CSF9GL4Y", ProductURL: "https://www.amazon.com.mx/dp/B0CSF9GL4Y", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CFBFM1JG", Name: "HP Papel Bond Carta 500 hojas", Category: "Office Product", Brand: "HP", Price: 148.0, Currency: "MXN", ASIN: "B0CFBFM1JG", ProductURL: "https://www.amazon.com.mx/dp/B0CFBFM1JG", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0B57LMQWT", Name: "Aurrera Insecticida Mata Mosquitos 400ml", Category: "Health and Beauty", Brand: "Aurrera", Price: 40.0, Currency: "MXN", ASIN: "B0B57LMQWT", ProductURL: "https://www.amazon.com.mx/dp/B0B57LMQWT", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D2N9SW4M", Name: "Aurrera Cloro 1L", Category: "Health and Beauty", Brand: "Aurrera", Price: 14.0, Currency: "MXN", ASIN: "B0D2N9SW4M", ProductURL: "https://www.amazon.com.mx/dp/B0D2N9SW4M", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0BNL36ZR9", Name: "Energizer Pilas AA MAX 8 unidades", Category: "Electronics", Brand: "Energizer", Price: 133.0, Currency: "MXN", ASIN: "B0BNL36ZR9", ProductURL: "https://www.amazon.com.mx/dp/B0BNL36ZR9", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CRYV4VVK", Name: "Nescafé Clásico Café Soluble 225g", Category: "Grocery", Brand: "Nescafé", Price: 137.0, Currency: "MXN", ASIN: "B0CRYV4VVK", ProductURL: "https://www.amazon.com.mx/dp/B0CRYV4VVK", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B07GCMD2LS", Name: "Command Ganchos para Exteriores 3M", Category: "Tools & Home Improvement", Brand: "Command", Price: 56.0, Currency: "MXN", ASIN: "B07GCMD2LS", ProductURL: "https://www.amazon.com.mx/dp/B07GCMD2LS", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CY62TT11", Name: "Pretul Cincel Punta 3/4x10", Category: "Tools & Home Improvement", Brand: "Pretul", Price: 52.0, Currency: "MXN", ASIN: "B0CY62TT11", ProductURL: "https://www.amazon.com.mx/dp/B0CY62TT11", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CMW3Y3FB", Name: "Lysol Desinfectante en Aerosol 354g", Category: "Health and Beauty", Brand: "Lysol", Price: 89.0, Currency: "MXN", ASIN: "B0CMW3Y3FB", ProductURL: "https://www.amazon.com.mx/dp/B0CMW3Y3FB", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B07NVQZ2V8", Name: "Truper Segueta con Marco 12 pulgadas", Category: "Tools & Home Improvement", Brand: "Truper", Price: 147.0, Currency: "MXN", ASIN: "B07NVQZ2V8", ProductURL: "https://www.amazon.com.mx/dp/B07NVQZ2V8", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CWM17R3V", Name: "FOSET Desarmador Plano 3/16x4", Category: "Tools & Home Improvement", Brand: "FOSET", Price: 33.0, Currency: "MXN", ASIN: "B0CWM17R3V", ProductURL: "https://www.amazon.com.mx/dp/B0CWM17R3V", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B00KBXRNC4", Name: "3M Cinta Masking Tape 24mm x 50m", Category: "Tools & Home Improvement", Brand: "3M", Price: 44.0, Currency: "MXN", ASIN: "B00KBXRNC4", ProductURL: "https://www.amazon.com.mx/dp/B00KBXRNC4", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B09RK3BP9N", Name: "Mapita Vasos Desechables 16oz 50 pzs", Category: "Kitchen", Brand: "Mapita", Price: 67.0, Currency: "MXN", ASIN: "B09RK3BP9N", ProductURL: "https://www.amazon.com.mx/dp/B09RK3BP9N", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0BRY5G1DW", Name: "Escudo Antibacterial Jabón en Gel 1L", Category: "Health and Beauty", Brand: "Escudo Antibacterial", Price: 83.0, Currency: "MXN", ASIN: "B0BRY5G1DW", ProductURL: "https://www.amazon.com.mx/dp/B0BRY5G1DW", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CWLN4ZQC", Name: "FOSET Desarmador Phillips #2", Category: "Tools & Home Improvement", Brand: "FOSET", Price: 35.0, Currency: "MXN", ASIN: "B0CWLN4ZQC", ProductURL: "https://www.amazon.com.mx/dp/B0CWLN4ZQC", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0BSKB3DHY", Name: "TP-Link Archer T2U Plus Adaptador WiFi AC600", Category: "Electronics", Brand: "TP-Link", Price: 229.0, Currency: "MXN", ASIN: "B0BSKB3DHY", ProductURL: "https://www.amazon.com.mx/dp/B0BSKB3DHY", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CKD4KLK8", Name: "Truper Tijera para Podar 8 pulgadas", Category: "Lawn & Garden", Brand: "Truper", Price: 148.0, Currency: "MXN", ASIN: "B0CKD4KLK8", ProductURL: "https://www.amazon.com.mx/dp/B0CKD4KLK8", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0D6Q11FQT", Name: "Mapita Platos Desechables #10 25 pzs", Category: "Kitchen", Brand: "Mapita", Price: 36.0, Currency: "MXN", ASIN: "B0D6Q11FQT", ProductURL: "https://www.amazon.com.mx/dp/B0D6Q11FQT", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B095PD53JY", Name: "Kleenex Pañuelos Desechables 90 hojas", Category: "Health and Beauty", Brand: "Kleenex", Price: 25.0, Currency: "MXN", ASIN: "B095PD53JY", ProductURL: "https://www.amazon.com.mx/dp/B095PD53JY", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
		{SKU: "AMZ-B0CX8Y95S3", Name: "Aurrera Trapeador Completo", Category: "Kitchen", Brand: "Aurrera", Price: 45.0, Currency: "MXN", ASIN: "B0CX8Y95S3", ProductURL: "https://www.amazon.com.mx/dp/B0CX8Y95S3", IsEcommerce: true, IsActive: true, Source: models.SourceExternal},
	}

	for _, product := range products {
		db.Create(&product)
	}
	log.Printf("Created %d products from Amazon order history", len(products))
}
