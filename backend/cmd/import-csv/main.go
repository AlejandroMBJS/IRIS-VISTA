package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"vista-backend/internal/models"
)

type ProductData struct {
	ASIN       string
	Title      string
	Category   string
	Brand      string
	Price      float64
	OrderCount int
}

func main() {
	if len(os.Args) < 3 {
		log.Fatal("Usage: import-csv <csv-file-path> <database-path>")
	}

	csvPath := os.Args[1]
	dbPath := os.Args[2]

	// Open database
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Open CSV file
	file, err := os.Open(csvPath)
	if err != nil {
		log.Fatalf("Failed to open CSV file: %v", err)
	}
	defer file.Close()

	// Read CSV
	reader := csv.NewReader(file)
	reader.LazyQuotes = true

	// Skip header
	_, err = reader.Read()
	if err != nil {
		log.Fatalf("Failed to read CSV header: %v", err)
	}

	// Map to track products by ASIN
	productMap := make(map[string]*ProductData)

	// Read all rows
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error reading row: %v", err)
			continue
		}

		// Skip if not enough columns
		if len(record) < 42 {
			continue
		}

		asin := strings.TrimSpace(record[23])
		if asin == "" || asin == "ASIN" {
			continue
		}

		// Parse price (PPU de la compra - column 40, index 39)
		priceStr := strings.TrimSpace(record[39])
		priceStr = strings.ReplaceAll(priceStr, "\"", "")
		priceStr = strings.ReplaceAll(priceStr, ",", "")
		price, _ := strconv.ParseFloat(priceStr, 64)

		// Get quantity (column 41, index 40)
		qtyStr := strings.TrimSpace(record[40])
		qty, _ := strconv.Atoi(qtyStr)
		if qty == 0 {
			qty = 1
		}

		if existing, ok := productMap[asin]; ok {
			// Increment order count
			existing.OrderCount += qty
		} else {
			title := strings.TrimSpace(record[24])
			category := strings.TrimSpace(record[22])
			brand := strings.TrimSpace(record[31])

			productMap[asin] = &ProductData{
				ASIN:       asin,
				Title:      title,
				Category:   category,
				Brand:      brand,
				Price:      price,
				OrderCount: qty,
			}
		}
	}

	// Filter products ordered more than once and insert into database
	rand.Seed(time.Now().UnixNano())
	inserted := 0
	updated := 0

	for _, product := range productMap {
		if product.OrderCount < 2 {
			continue
		}

		// Check if product already exists
		var existing models.Product
		result := db.Where("asin = ?", product.ASIN).First(&existing)

		if result.Error == nil {
			// Update existing product
			existing.Name = product.Title
			existing.Category = product.Category
			existing.Brand = product.Brand
			if product.Price > 0 {
				existing.Price = product.Price
			}
			existing.IsEcommerce = true
			existing.ProductURL = fmt.Sprintf("https://www.amazon.com.mx/dp/%s", product.ASIN)
			// Update stock with random quantity (10-100)
			existing.Stock = rand.Intn(91) + 10
			db.Save(&existing)
			updated++
			fmt.Printf("Updated: %s (ASIN: %s, Orders: %d)\n", truncate(product.Title, 50), product.ASIN, product.OrderCount)
		} else {
			// Create new product
			sku := fmt.Sprintf("AMZ-%s", product.ASIN)
			newProduct := models.Product{
				SKU:         sku,
				Name:        product.Title,
				Category:    product.Category,
				Brand:       product.Brand,
				Supplier:    "Amazon",
				Price:       product.Price,
				Currency:    "MXN",
				Stock:       rand.Intn(91) + 10, // Random stock 10-100
				MinStock:    5,
				MaxStock:    100,
				Source:      models.SourceExternal,
				IsActive:    true,
				IsEcommerce: true,
				ASIN:        product.ASIN,
				ProductURL:  fmt.Sprintf("https://www.amazon.com.mx/dp/%s", product.ASIN),
			}
			db.Create(&newProduct)
			inserted++
			fmt.Printf("Inserted: %s (ASIN: %s, Orders: %d)\n", truncate(product.Title, 50), product.ASIN, product.OrderCount)
		}
	}

	fmt.Printf("\n=== Summary ===\n")
	fmt.Printf("Total products in CSV: %d\n", len(productMap))
	fmt.Printf("Products with 2+ orders: %d\n", inserted+updated)
	fmt.Printf("New products inserted: %d\n", inserted)
	fmt.Printf("Existing products updated: %d\n", updated)
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
