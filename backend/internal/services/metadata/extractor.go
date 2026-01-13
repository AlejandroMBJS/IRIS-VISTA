package metadata

import (
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// ProductMetadata contains extracted metadata from a product URL
type ProductMetadata struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	ImageURL    string   `json:"image_url"`
	Price       *float64 `json:"price,omitempty"`
	Currency    string   `json:"currency,omitempty"`
	SiteName    string   `json:"site_name,omitempty"`
}

// Extractor extracts metadata from product URLs
type Extractor struct {
	client *http.Client
}

// NewExtractor creates a new metadata extractor
func NewExtractor() *Extractor {
	return &Extractor{
		client: &http.Client{
			Timeout: 15 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 5 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
	}
}

// ExtractFromURL extracts product metadata from a given URL
func (e *Extractor) ExtractFromURL(url string) (*ProductMetadata, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers to appear as a regular browser - more complete headers
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
	req.Header.Set("Accept-Language", "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Pragma", "no-cache")
	req.Header.Set("Sec-Ch-Ua", `"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"`)
	req.Header.Set("Sec-Ch-Ua-Mobile", "?0")
	req.Header.Set("Sec-Ch-Ua-Platform", `"Windows"`)
	req.Header.Set("Sec-Fetch-Dest", "document")
	req.Header.Set("Sec-Fetch-Mode", "navigate")
	req.Header.Set("Sec-Fetch-Site", "none")
	req.Header.Set("Sec-Fetch-User", "?1")
	req.Header.Set("Upgrade-Insecure-Requests", "1")

	resp, err := e.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Handle gzip encoding
	var reader io.Reader = resp.Body
	if resp.Header.Get("Content-Encoding") == "gzip" {
		gzReader, err := gzip.NewReader(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to create gzip reader: %w", err)
		}
		defer gzReader.Close()
		reader = gzReader
	}

	doc, err := goquery.NewDocumentFromReader(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	metadata := &ProductMetadata{}

	// 1. Try Open Graph tags first (og:*)
	metadata.Title = e.getMetaContent(doc, "og:title")
	metadata.Description = e.getMetaContent(doc, "og:description")
	metadata.ImageURL = e.getMetaContent(doc, "og:image")
	metadata.SiteName = e.getMetaContent(doc, "og:site_name")

	// Try to get price from og:price:amount
	if priceStr := e.getMetaContent(doc, "og:price:amount"); priceStr != "" {
		if price, err := e.parsePrice(priceStr); err == nil {
			metadata.Price = &price
		}
	}
	metadata.Currency = e.getMetaContent(doc, "og:price:currency")

	// 2. Fallback to Twitter Card tags
	if metadata.Title == "" {
		metadata.Title = e.getMetaContent(doc, "twitter:title")
	}
	if metadata.Description == "" {
		metadata.Description = e.getMetaContent(doc, "twitter:description")
	}
	if metadata.ImageURL == "" {
		metadata.ImageURL = e.getMetaContent(doc, "twitter:image")
	}

	// 3. Fallback to standard meta tags
	if metadata.Title == "" {
		metadata.Title = e.getMetaName(doc, "title")
	}
	if metadata.Description == "" {
		metadata.Description = e.getMetaName(doc, "description")
	}

	// 4. Fallback to <title> tag
	if metadata.Title == "" {
		metadata.Title = strings.TrimSpace(doc.Find("title").First().Text())
	}

	// 5. Try to find first significant image if no image yet
	if metadata.ImageURL == "" {
		metadata.ImageURL = e.findFirstSignificantImage(doc, url)
	}

	// 6. Try JSON-LD schema.org markup (very reliable for prices)
	e.extractJSONLD(doc, metadata)

	// 7. Site-specific extractors
	e.extractSiteSpecific(doc, url, metadata)

	// Clean up title (remove site name suffix if present)
	metadata.Title = e.cleanTitle(metadata.Title, metadata.SiteName)

	return metadata, nil
}

// getMetaContent gets content from meta property tags (og:*, product:*)
func (e *Extractor) getMetaContent(doc *goquery.Document, property string) string {
	var content string
	doc.Find(fmt.Sprintf(`meta[property="%s"]`, property)).Each(func(i int, s *goquery.Selection) {
		if c, exists := s.Attr("content"); exists && content == "" {
			content = strings.TrimSpace(c)
		}
	})
	return content
}

// getMetaName gets content from meta name tags
func (e *Extractor) getMetaName(doc *goquery.Document, name string) string {
	var content string
	doc.Find(fmt.Sprintf(`meta[name="%s"]`, name)).Each(func(i int, s *goquery.Selection) {
		if c, exists := s.Attr("content"); exists && content == "" {
			content = strings.TrimSpace(c)
		}
	})
	return content
}

// findFirstSignificantImage finds the first image that appears to be a product image
func (e *Extractor) findFirstSignificantImage(doc *goquery.Document, baseURL string) string {
	var imageURL string

	// Look for common product image selectors
	selectors := []string{
		"#landingImage",                    // Amazon
		"#imgBlkFront",                     // Amazon alternative
		".product-image img",               // Generic
		".gallery-image img",               // Generic gallery
		"[data-main-image]",                // Data attribute
		".product img",                     // Generic product
		"article img",                      // Article main image
		".main-image img",                  // Main image class
		"picture source",                   // Picture element
	}

	for _, selector := range selectors {
		doc.Find(selector).Each(func(i int, s *goquery.Selection) {
			if imageURL != "" {
				return
			}

			// Try different attributes
			for _, attr := range []string{"src", "data-src", "srcset", "data-a-dynamic-image"} {
				if src, exists := s.Attr(attr); exists && src != "" {
					// Handle srcset (take first URL)
					if attr == "srcset" {
						parts := strings.Split(src, ",")
						if len(parts) > 0 {
							src = strings.Fields(parts[0])[0]
						}
					}
					// Handle data-a-dynamic-image (Amazon JSON)
					if attr == "data-a-dynamic-image" {
						src = e.extractAmazonImageFromJSON(src)
					}
					if src != "" && !strings.HasPrefix(src, "data:") {
						imageURL = e.makeAbsoluteURL(src, baseURL)
						return
					}
				}
			}
		})
		if imageURL != "" {
			break
		}
	}

	return imageURL
}

// extractSiteSpecific handles site-specific extraction logic
func (e *Extractor) extractSiteSpecific(doc *goquery.Document, url string, metadata *ProductMetadata) {
	lowerURL := strings.ToLower(url)

	// Amazon
	if strings.Contains(lowerURL, "amazon.com") || strings.Contains(lowerURL, "amazon.com.mx") {
		e.extractAmazon(doc, metadata)
	}

	// MercadoLibre
	if strings.Contains(lowerURL, "mercadolibre.com") || strings.Contains(lowerURL, "mercadolibre.com.mx") {
		e.extractMercadoLibre(doc, metadata)
	}

	// Generic price extraction if still no price
	if metadata.Price == nil {
		e.extractGenericPrice(doc, metadata)
	}

	// Default currency if not set
	if metadata.Currency == "" {
		if strings.Contains(lowerURL, ".mx") {
			metadata.Currency = "MXN"
		} else if strings.Contains(lowerURL, ".com") {
			metadata.Currency = "USD"
		}
	}
}

// extractGenericPrice tries generic selectors for price extraction
func (e *Extractor) extractGenericPrice(doc *goquery.Document, metadata *ProductMetadata) {
	// Common price selectors used by many e-commerce sites
	priceSelectors := []string{
		// Microdata/schema.org
		`[itemprop="price"]`,
		`[data-price]`,
		`[data-product-price]`,
		// Common class names
		`.price`,
		`.product-price`,
		`.current-price`,
		`.sale-price`,
		`.final-price`,
		`.regular-price`,
		`.offer-price`,
		`.price-current`,
		`.price-value`,
		`.product__price`,
		`#product-price`,
		`#price`,
		// Spans and divs with price-related classes
		`span[class*="price"]`,
		`div[class*="price"]`,
		`p[class*="price"]`,
		// WooCommerce
		`.woocommerce-Price-amount`,
		// Shopify
		`.product__price`,
		`[data-product-price]`,
		// BigCommerce
		`.price--main`,
		// Magento
		`.price-box .price`,
		// Generic money patterns
		`[class*="money"]`,
		`[class*="amount"]`,
	}

	for _, selector := range priceSelectors {
		doc.Find(selector).Each(func(i int, s *goquery.Selection) {
			if metadata.Price != nil {
				return
			}

			// Try content attribute first (microdata)
			if content, exists := s.Attr("content"); exists && content != "" {
				if price, err := e.parsePrice(content); err == nil && price > 0 {
					metadata.Price = &price
					return
				}
			}

			// Try data-price attribute
			if dataPrice, exists := s.Attr("data-price"); exists && dataPrice != "" {
				if price, err := e.parsePrice(dataPrice); err == nil && price > 0 {
					metadata.Price = &price
					return
				}
			}

			// Try text content
			priceText := strings.TrimSpace(s.Text())
			if priceText != "" {
				if price, err := e.parsePrice(priceText); err == nil && price > 0 {
					metadata.Price = &price
					return
				}
			}
		})

		if metadata.Price != nil {
			break
		}
	}
}

// extractAmazon extracts Amazon-specific data
func (e *Extractor) extractAmazon(doc *goquery.Document, metadata *ProductMetadata) {
	// Title from product title - multiple selectors
	if metadata.Title == "" {
		titleSelectors := []string{
			"#productTitle",
			"#title span",
			"span#productTitle",
			"h1#title span",
			"h1.a-size-large",
		}
		for _, selector := range titleSelectors {
			if title := strings.TrimSpace(doc.Find(selector).First().Text()); title != "" {
				metadata.Title = title
				break
			}
		}
	}

	// Price - try many different selectors (Amazon changes these frequently)
	if metadata.Price == nil {
		// First try offscreen selectors that contain the full price with decimals
		offscreenSelectors := []string{
			".a-price .a-offscreen",
			"#corePrice_feature_div .a-offscreen",
			"#corePriceDisplay_desktop_feature_div .a-offscreen",
			".apexPriceToPay .a-offscreen",
			"#apex_offerDisplay_desktop .a-offscreen",
			".reinventPricePriceToPayMargin .a-offscreen",
			"span.a-price span.a-offscreen",
			"#tp_price_block_total_price_ww .a-offscreen",
			".priceToPay .a-offscreen",
			"#priceblock_ourprice",
			"#priceblock_dealprice",
			"#priceblock_saleprice",
			"#price_inside_buybox",
		}
		for _, selector := range offscreenSelectors {
			if priceText := strings.TrimSpace(doc.Find(selector).First().Text()); priceText != "" {
				if price, err := e.parsePrice(priceText); err == nil && price > 0 {
					metadata.Price = &price
					break
				}
			}
		}
	}

	// If still no price, try combining whole + fraction (Amazon splits prices visually)
	if metadata.Price == nil {
		// Try different price containers
		priceContainers := []string{
			".a-price",
			"#corePrice_feature_div .a-price",
			"#corePriceDisplay_desktop_feature_div .a-price",
			".apexPriceToPay",
			".priceToPay",
			"#tp_price_block_total_price_ww",
		}

		for _, containerSelector := range priceContainers {
			container := doc.Find(containerSelector).First()
			if container.Length() == 0 {
				continue
			}

			// Get the whole part (integer)
			whole := strings.TrimSpace(container.Find(".a-price-whole").First().Text())
			// Get the fraction part (decimals)
			fraction := strings.TrimSpace(container.Find(".a-price-fraction").First().Text())

			if whole != "" {
				// Remove any trailing dot/comma from whole part
				whole = strings.TrimRight(whole, ".,")
				// Clean up thousand separators
				whole = strings.ReplaceAll(whole, ",", "")
				whole = strings.ReplaceAll(whole, ".", "")

				priceStr := whole
				if fraction != "" {
					// Ensure fraction is 2 digits
					if len(fraction) == 1 {
						fraction = fraction + "0"
					}
					priceStr = whole + "." + fraction
				} else {
					priceStr = whole + ".00"
				}

				if price, err := strconv.ParseFloat(priceStr, 64); err == nil && price > 0 {
					metadata.Price = &price
					break
				}
			}
		}
	}

	// Image - try multiple selectors and attributes
	if metadata.ImageURL == "" {
		imageSelectors := []string{
			"#landingImage",
			"#imgBlkFront",
			"#main-image",
			"#ebooksImgBlkFront",
			".a-dynamic-image",
			"#imgTagWrapperId img",
			"#imageBlock img",
		}
		for _, selector := range imageSelectors {
			el := doc.Find(selector).First()
			// Try data-a-dynamic-image first (contains high-res images)
			if jsonStr, exists := el.Attr("data-a-dynamic-image"); exists && jsonStr != "" {
				if imgURL := e.extractAmazonImageFromJSON(jsonStr); imgURL != "" {
					metadata.ImageURL = imgURL
					break
				}
			}
			// Try data-old-hires
			if src, exists := el.Attr("data-old-hires"); exists && src != "" {
				metadata.ImageURL = src
				break
			}
			// Try src
			if src, exists := el.Attr("src"); exists && src != "" && !strings.HasPrefix(src, "data:") {
				metadata.ImageURL = src
				break
			}
		}
	}

	if metadata.SiteName == "" {
		metadata.SiteName = "Amazon"
	}

	if metadata.Currency == "" {
		metadata.Currency = "MXN"
	}
}

// extractMercadoLibre extracts MercadoLibre-specific data
func (e *Extractor) extractMercadoLibre(doc *goquery.Document, metadata *ProductMetadata) {
	// Title - multiple selectors
	if metadata.Title == "" {
		titleSelectors := []string{
			".ui-pdp-title",
			"h1.ui-pdp-title",
			".item-title__primary",
			"h1[class*='title']",
		}
		for _, selector := range titleSelectors {
			if title := strings.TrimSpace(doc.Find(selector).First().Text()); title != "" {
				metadata.Title = title
				break
			}
		}
	}

	// Price - MercadoLibre splits price into fraction and cents
	if metadata.Price == nil {
		// Try to get the full price from the container that has both parts
		priceContainerSelectors := []string{
			".ui-pdp-price__second-line .andes-money-amount",
			".andes-money-amount--cents-superscript",
			".andes-money-amount",
			".price-tag",
		}
		for _, selector := range priceContainerSelectors {
			container := doc.Find(selector).First()
			if container.Length() == 0 {
				continue
			}

			// Get fraction (integer part) - try multiple selectors
			fractionSelectors := []string{
				".andes-money-amount__fraction",
				".price-tag-fraction",
				"span[class*='fraction']",
			}
			var fraction string
			for _, fs := range fractionSelectors {
				if f := strings.TrimSpace(container.Find(fs).First().Text()); f != "" {
					fraction = f
					break
				}
			}

			// Get cents (decimal part) - try multiple selectors
			centsSelectors := []string{
				".andes-money-amount__cents",
				".price-tag-cents",
				"span[class*='cents']",
				"sup",
			}
			var cents string
			for _, cs := range centsSelectors {
				if c := strings.TrimSpace(container.Find(cs).First().Text()); c != "" {
					cents = c
					break
				}
			}

			if fraction != "" {
				priceStr := fraction
				if cents != "" && len(cents) <= 2 {
					// Pad cents to 2 digits if needed (e.g., "9" -> "90")
					if len(cents) == 1 {
						cents = cents + "0"
					}
					priceStr = fraction + "." + cents
				}
				if price, err := e.parsePrice(priceStr); err == nil && price > 0 {
					metadata.Price = &price
					break
				}
			}
		}
	}

	// Fallback: try simple selectors
	if metadata.Price == nil {
		priceSelectors := []string{
			"[itemprop='price']",
			".ui-pdp-price__main-container .andes-money-amount",
			"meta[itemprop='price']",
		}
		for _, selector := range priceSelectors {
			el := doc.Find(selector).First()
			// Try content attribute (schema.org)
			if content, exists := el.Attr("content"); exists && content != "" {
				if price, err := e.parsePrice(content); err == nil && price > 0 {
					metadata.Price = &price
					break
				}
			}
			// Try text
			if priceText := strings.TrimSpace(el.Text()); priceText != "" {
				if price, err := e.parsePrice(priceText); err == nil && price > 0 {
					metadata.Price = &price
					break
				}
			}
		}
	}

	// Image - multiple selectors and attributes
	if metadata.ImageURL == "" {
		imageSelectors := []string{
			".ui-pdp-image",
			".ui-pdp-gallery__figure img",
			"figure.ui-pdp-gallery__figure img",
			"img[data-zoom]",
			".gallery-image img",
		}
		for _, selector := range imageSelectors {
			el := doc.Find(selector).First()
			// Try data-zoom first (high-res)
			if src, exists := el.Attr("data-zoom"); exists && src != "" {
				metadata.ImageURL = src
				break
			}
			if src, exists := el.Attr("src"); exists && src != "" && !strings.HasPrefix(src, "data:") {
				metadata.ImageURL = src
				break
			}
		}
	}

	if metadata.SiteName == "" {
		metadata.SiteName = "MercadoLibre"
	}

	if metadata.Currency == "" {
		metadata.Currency = "MXN"
	}
}

// parsePrice parses a price string into a float64
func (e *Extractor) parsePrice(priceStr string) (float64, error) {
	// Remove currency symbols and whitespace
	priceStr = strings.TrimSpace(priceStr)

	// Remove common currency symbols and characters (but keep commas and dots for now)
	replacer := strings.NewReplacer(
		"$", "", "USD", "", "MXN", "", "€", "", "£", "",
		" ", "", "\u00a0", "", // non-breaking space
	)
	priceStr = replacer.Replace(priceStr)

	// Handle different decimal separators
	// Format: 1,234.56 (US) or 1.234,56 (Latin/Europe)
	// Count dots and commas to determine format
	dotCount := strings.Count(priceStr, ".")
	commaCount := strings.Count(priceStr, ",")

	if commaCount > 0 && dotCount > 0 {
		// Both present - determine which is decimal separator
		lastDot := strings.LastIndex(priceStr, ".")
		lastComma := strings.LastIndex(priceStr, ",")

		if lastComma > lastDot {
			// Comma is decimal separator (1.234,56)
			priceStr = strings.ReplaceAll(priceStr, ".", "")
			priceStr = strings.Replace(priceStr, ",", ".", 1)
		} else {
			// Dot is decimal separator (1,234.56)
			priceStr = strings.ReplaceAll(priceStr, ",", "")
		}
	} else if commaCount == 1 && dotCount == 0 {
		// Only comma - check if it's decimal separator
		// If comma is followed by exactly 2 digits at end, it's decimal
		parts := strings.Split(priceStr, ",")
		if len(parts) == 2 && len(parts[1]) <= 2 {
			// Comma is decimal separator (269,99)
			priceStr = strings.Replace(priceStr, ",", ".", 1)
		} else {
			// Comma is thousand separator (1,234)
			priceStr = strings.ReplaceAll(priceStr, ",", "")
		}
	} else if commaCount > 1 {
		// Multiple commas - thousand separators (1,234,567)
		priceStr = strings.ReplaceAll(priceStr, ",", "")
	}
	// If only dots, keep as-is (standard format)

	// Extract numeric value using regex
	re := regexp.MustCompile(`[\d.]+`)
	matches := re.FindString(priceStr)
	if matches == "" {
		return 0, fmt.Errorf("no numeric value found in: %s", priceStr)
	}

	return strconv.ParseFloat(matches, 64)
}

// makeAbsoluteURL converts a relative URL to absolute
func (e *Extractor) makeAbsoluteURL(src, baseURL string) string {
	if strings.HasPrefix(src, "http://") || strings.HasPrefix(src, "https://") {
		return src
	}
	if strings.HasPrefix(src, "//") {
		return "https:" + src
	}
	if strings.HasPrefix(src, "/") {
		// Extract base domain from URL
		re := regexp.MustCompile(`^(https?://[^/]+)`)
		if matches := re.FindStringSubmatch(baseURL); len(matches) > 1 {
			return matches[1] + src
		}
	}
	return src
}

// extractAmazonImageFromJSON extracts image URL from Amazon's data-a-dynamic-image JSON
func (e *Extractor) extractAmazonImageFromJSON(jsonStr string) string {
	// Simple extraction - find first URL in the JSON
	re := regexp.MustCompile(`"(https://[^"]+)"`)
	matches := re.FindStringSubmatch(jsonStr)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

// extractJSONLD extracts product data from JSON-LD schema.org markup
func (e *Extractor) extractJSONLD(doc *goquery.Document, metadata *ProductMetadata) {
	doc.Find(`script[type="application/ld+json"]`).Each(func(i int, s *goquery.Selection) {
		jsonStr := strings.TrimSpace(s.Text())
		if jsonStr == "" {
			return
		}

		// Try to parse as a single object
		var data map[string]interface{}
		if err := json.Unmarshal([]byte(jsonStr), &data); err == nil {
			e.parseJSONLDObject(data, metadata)
			return
		}

		// Try to parse as an array
		var dataArray []map[string]interface{}
		if err := json.Unmarshal([]byte(jsonStr), &dataArray); err == nil {
			for _, item := range dataArray {
				e.parseJSONLDObject(item, metadata)
			}
		}
	})
}

// parseJSONLDObject parses a single JSON-LD object for product data
func (e *Extractor) parseJSONLDObject(data map[string]interface{}, metadata *ProductMetadata) {
	// Check @type
	typeVal, _ := data["@type"].(string)

	// Handle @graph structure
	if graph, ok := data["@graph"].([]interface{}); ok {
		for _, item := range graph {
			if itemMap, ok := item.(map[string]interface{}); ok {
				e.parseJSONLDObject(itemMap, metadata)
			}
		}
		return
	}

	// Product type
	if typeVal == "Product" || typeVal == "IndividualProduct" {
		// Extract name/title
		if metadata.Title == "" {
			if name, ok := data["name"].(string); ok && name != "" {
				metadata.Title = name
			}
		}

		// Extract description
		if metadata.Description == "" {
			if desc, ok := data["description"].(string); ok && desc != "" {
				metadata.Description = desc
			}
		}

		// Extract image
		if metadata.ImageURL == "" {
			switch img := data["image"].(type) {
			case string:
				metadata.ImageURL = img
			case []interface{}:
				if len(img) > 0 {
					if imgStr, ok := img[0].(string); ok {
						metadata.ImageURL = imgStr
					} else if imgMap, ok := img[0].(map[string]interface{}); ok {
						if url, ok := imgMap["url"].(string); ok {
							metadata.ImageURL = url
						}
					}
				}
			case map[string]interface{}:
				if url, ok := img["url"].(string); ok {
					metadata.ImageURL = url
				}
			}
		}

		// Extract offers/price
		if metadata.Price == nil {
			if offers, ok := data["offers"].(map[string]interface{}); ok {
				e.parseJSONLDOffer(offers, metadata)
			} else if offersArray, ok := data["offers"].([]interface{}); ok && len(offersArray) > 0 {
				if offer, ok := offersArray[0].(map[string]interface{}); ok {
					e.parseJSONLDOffer(offer, metadata)
				}
			}
		}
	}

	// Offer type (standalone)
	if typeVal == "Offer" || typeVal == "AggregateOffer" {
		e.parseJSONLDOffer(data, metadata)
	}
}

// parseJSONLDOffer extracts price from a JSON-LD Offer object
func (e *Extractor) parseJSONLDOffer(offer map[string]interface{}, metadata *ProductMetadata) {
	if metadata.Price != nil {
		return
	}

	// Try price field - handle various JSON number types
	switch price := offer["price"].(type) {
	case float64:
		metadata.Price = &price
	case int:
		p := float64(price)
		metadata.Price = &p
	case int64:
		p := float64(price)
		metadata.Price = &p
	case json.Number:
		if p, err := price.Float64(); err == nil && p > 0 {
			metadata.Price = &p
		}
	case string:
		if p, err := e.parsePrice(price); err == nil && p > 0 {
			metadata.Price = &p
		}
	}

	// Try lowPrice for AggregateOffer
	if metadata.Price == nil {
		switch price := offer["lowPrice"].(type) {
		case float64:
			metadata.Price = &price
		case int:
			p := float64(price)
			metadata.Price = &p
		case int64:
			p := float64(price)
			metadata.Price = &p
		case json.Number:
			if p, err := price.Float64(); err == nil && p > 0 {
				metadata.Price = &p
			}
		case string:
			if p, err := e.parsePrice(price); err == nil && p > 0 {
				metadata.Price = &p
			}
		}
	}

	// Extract currency
	if metadata.Currency == "" {
		if currency, ok := offer["priceCurrency"].(string); ok && currency != "" {
			metadata.Currency = currency
		}
	}
}

// cleanTitle removes site name suffix from title
func (e *Extractor) cleanTitle(title, siteName string) string {
	if siteName == "" || title == "" {
		return title
	}

	// Common separators
	separators := []string{" - ", " | ", " – ", " — "}
	for _, sep := range separators {
		if idx := strings.LastIndex(title, sep); idx > 0 {
			suffix := strings.TrimSpace(title[idx+len(sep):])
			if strings.EqualFold(suffix, siteName) || strings.Contains(strings.ToLower(suffix), strings.ToLower(siteName)) {
				title = strings.TrimSpace(title[:idx])
			}
		}
	}

	return title
}

// Service wraps the Extractor for dependency injection
type Service struct {
	extractor *Extractor
}

// NewService creates a new metadata service
func NewService() *Service {
	return &Service{
		extractor: NewExtractor(),
	}
}

// Extract extracts metadata from a URL
func (s *Service) Extract(url string) (*ProductMetadata, error) {
	return s.extractor.ExtractFromURL(url)
}
