package translation

import (
	"encoding/json"
	"log"
	"sync"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// AsyncTranslator handles asynchronous translation with priority for user's current language
type AsyncTranslator struct {
	translator *Translator
	db         *gorm.DB
	wg         sync.WaitGroup
}

// NewAsyncTranslator creates a new async translator
func NewAsyncTranslator(db *gorm.DB) *AsyncTranslator {
	return &AsyncTranslator{
		translator: NewTranslator(),
		db:         db,
	}
}

// TranslateFieldResult contains the initial translation and a channel for completion
type TranslateFieldResult struct {
	Translated *TranslatedText
	JSON       datatypes.JSON
}

// TranslateField translates text with priority for the user's language
// Returns immediately with translation for userLang, then completes other languages in background
func (at *AsyncTranslator) TranslateField(
	text string,
	userLang string,
	onComplete func(translated *TranslatedText) error,
) (*TranslateFieldResult, error) {
	if text == "" {
		return nil, nil
	}

	// Limit text length
	if len(text) > 1000 {
		text = text[:1000]
	}

	// Detect source language
	sourceLang := at.translator.DetectLanguage(text)

	result := &TranslatedText{
		Original: text,
	}

	// 1. SYNCHRONOUS: Translate to user's language first (fast response)
	if userLang != "" && userLang != sourceLang {
		translated, err := at.translator.translate(text, sourceLang, userLang)
		if err != nil {
			translated = text // Fallback to original
		}
		at.setLanguageField(result, userLang, translated)
	} else if userLang != "" {
		// Source is same as target
		at.setLanguageField(result, userLang, text)
	}

	// Also set the source language field
	if sourceLang != "auto" && sourceLang != userLang {
		at.setLanguageField(result, sourceLang, text)
	}

	// Convert to JSON for immediate return
	jsonData, _ := json.Marshal(result)
	initialResult := &TranslateFieldResult{
		Translated: result,
		JSON:       datatypes.JSON(jsonData),
	}

	// 2. ASYNCHRONOUS: Translate to remaining languages in background
	at.wg.Add(1)
	go func() {
		defer at.wg.Done()

		// Complete result with a copy to avoid race conditions
		completeResult := &TranslatedText{
			Original: result.Original,
			En:       result.En,
			Zh:       result.Zh,
			Es:       result.Es,
		}

		allLangs := []string{"en", "zh", "es"}
		for _, targetLang := range allLangs {
			// Skip if already translated
			if at.getLanguageField(completeResult, targetLang) != "" {
				continue
			}

			// Translate
			translated, err := at.translator.translate(text, sourceLang, targetLang)
			if err != nil {
				log.Printf("Async translation error for %s: %v", targetLang, err)
				translated = text // Fallback
			}
			at.setLanguageField(completeResult, targetLang, translated)
		}

		// Call completion callback to save to DB
		if onComplete != nil {
			if err := onComplete(completeResult); err != nil {
				log.Printf("Failed to save async translation: %v", err)
			}
		}
	}()

	return initialResult, nil
}

// TranslateFieldSync translates text synchronously to all languages
// Use this when you need all translations immediately (e.g., for responses that must include all)
func (at *AsyncTranslator) TranslateFieldSync(text string) (*TranslateFieldResult, error) {
	if text == "" {
		return nil, nil
	}

	sourceLang := at.translator.DetectLanguage(text)
	result, err := at.translator.TranslateToAll(text, sourceLang)
	if err != nil {
		return nil, err
	}

	jsonData, _ := json.Marshal(result)
	return &TranslateFieldResult{
		Translated: result,
		JSON:       datatypes.JSON(jsonData),
	}, nil
}

// Wait waits for all background translations to complete
func (at *AsyncTranslator) Wait() {
	at.wg.Wait()
}

// setLanguageField sets the appropriate language field in TranslatedText
func (at *AsyncTranslator) setLanguageField(t *TranslatedText, lang, value string) {
	switch lang {
	case "en":
		t.En = value
	case "zh":
		t.Zh = value
	case "es":
		t.Es = value
	}
}

// getLanguageField gets the appropriate language field from TranslatedText
func (at *AsyncTranslator) getLanguageField(t *TranslatedText, lang string) string {
	switch lang {
	case "en":
		return t.En
	case "zh":
		return t.Zh
	case "es":
		return t.Es
	}
	return ""
}

// ToJSON converts TranslatedText to datatypes.JSON
func ToJSON(t *TranslatedText) datatypes.JSON {
	if t == nil {
		return nil
	}
	data, _ := json.Marshal(t)
	return datatypes.JSON(data)
}

// FromJSON converts datatypes.JSON to TranslatedText
func FromJSON(data datatypes.JSON) *TranslatedText {
	if data == nil {
		return nil
	}
	var t TranslatedText
	if err := json.Unmarshal(data, &t); err != nil {
		return nil
	}
	return &t
}
