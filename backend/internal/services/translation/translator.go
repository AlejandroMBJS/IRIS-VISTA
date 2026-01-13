package translation

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Translator handles text translation between languages
type Translator struct {
	client *http.Client
}

// TranslatedText contains text translated to multiple languages
type TranslatedText struct {
	Original string `json:"original"`
	En       string `json:"en"`
	Zh       string `json:"zh"`
	Es       string `json:"es"`
}

// NewTranslator creates a new translator instance
func NewTranslator() *Translator {
	return &Translator{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// TranslateToAll translates text from source language to all supported languages
func (t *Translator) TranslateToAll(text string, sourceLanguage string) (*TranslatedText, error) {
	if text == "" {
		return &TranslatedText{}, nil
	}

	// Limit text length to avoid issues
	if len(text) > 1000 {
		text = text[:1000]
	}

	result := &TranslatedText{
		Original: text,
	}

	// Supported languages
	targetLanguages := []string{"en", "zh", "es"}

	for _, targetLang := range targetLanguages {
		// Skip if source and target are the same
		if sourceLanguage == targetLang {
			switch targetLang {
			case "en":
				result.En = text
			case "zh":
				result.Zh = text
			case "es":
				result.Es = text
			}
			continue
		}

		translated, err := t.translate(text, sourceLanguage, targetLang)
		if err != nil {
			// On error, use original text
			translated = text
		}

		switch targetLang {
		case "en":
			result.En = translated
		case "zh":
			result.Zh = translated
		case "es":
			result.Es = translated
		}
	}

	return result, nil
}

// translate translates text using Google Translate free API
func (t *Translator) translate(text, sourceLang, targetLang string) (string, error) {
	// Use Google Translate free API endpoint
	baseURL := "https://translate.googleapis.com/translate_a/single"

	params := url.Values{}
	params.Add("client", "gtx")
	params.Add("sl", sourceLang)
	params.Add("tl", targetLang)
	params.Add("dt", "t")
	params.Add("q", text)

	reqURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return text, err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := t.client.Do(req)
	if err != nil {
		return text, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return text, fmt.Errorf("translation failed with status: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return text, err
	}

	// Parse the response - Google returns nested arrays
	// Format: [[["translated text","original text",null,null,10]],null,"en",...]
	var result []interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return text, err
	}

	// Extract translated text from nested structure
	if len(result) > 0 {
		if sentences, ok := result[0].([]interface{}); ok {
			var translatedText strings.Builder
			for _, sentence := range sentences {
				if parts, ok := sentence.([]interface{}); ok && len(parts) > 0 {
					if translated, ok := parts[0].(string); ok {
						translatedText.WriteString(translated)
					}
				}
			}
			if translatedText.Len() > 0 {
				return translatedText.String(), nil
			}
		}
	}

	return text, fmt.Errorf("could not parse translation response")
}

// DetectLanguage attempts to detect the language of the text
func (t *Translator) DetectLanguage(text string) string {
	if text == "" {
		return "en"
	}

	// Simple heuristic detection based on character ranges
	// Check for Chinese characters
	for _, r := range text {
		if r >= 0x4E00 && r <= 0x9FFF {
			return "zh"
		}
	}

	// Check for Spanish-specific characters or patterns
	spanishPatterns := []string{"ñ", "¿", "¡", "ó", "á", "é", "í", "ú"}
	lowerText := strings.ToLower(text)
	for _, pattern := range spanishPatterns {
		if strings.Contains(lowerText, pattern) {
			return "es"
		}
	}

	// Default to auto-detect (let Google decide)
	return "auto"
}

// Service wraps the Translator for dependency injection
type Service struct {
	translator *Translator
}

// NewService creates a new translation service
func NewService() *Service {
	return &Service{
		translator: NewTranslator(),
	}
}

// Translate translates text to all supported languages
func (s *Service) Translate(text string) (*TranslatedText, error) {
	sourceLang := s.translator.DetectLanguage(text)
	return s.translator.TranslateToAll(text, sourceLang)
}

// TranslateWithSource translates text from a known source language
func (s *Service) TranslateWithSource(text, sourceLang string) (*TranslatedText, error) {
	return s.translator.TranslateToAll(text, sourceLang)
}
