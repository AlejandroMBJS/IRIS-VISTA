package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AISummaryHandler struct{}

func NewAISummaryHandler() *AISummaryHandler {
	return &AISummaryHandler{}
}

type SummaryRequest struct {
	Items []SummaryItem `json:"items"`
	Justification string `json:"justification"`
	Language string `json:"language"`
}

type SummaryItem struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Currency    string  `json:"currency"`
	Quantity    int     `json:"quantity"`
}

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

type OllamaResponse struct {
	Model     string `json:"model"`
	Response  string `json:"response"`
	Done      bool   `json:"done"`
}

func (h *AISummaryHandler) GenerateSummary(c *gin.Context) {
	var req SummaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build the product information string
	var productInfo strings.Builder
	totalAmount := 0.0
	for i, item := range req.Items {
		subtotal := item.Price * float64(item.Quantity)
		totalAmount += subtotal
		productInfo.WriteString(fmt.Sprintf("\n%d. %s", i+1, item.Title))
		if item.Description != "" {
			productInfo.WriteString(fmt.Sprintf("\n   Description: %s", item.Description))
		}
		productInfo.WriteString(fmt.Sprintf("\n   Price: %s $%.2f x %d = $%.2f", item.Currency, item.Price, item.Quantity, subtotal))
	}

	// Determine language for response
	langInstruction := "Respond in English."
	switch req.Language {
	case "es":
		langInstruction = "Responde en español."
	case "zh":
		langInstruction = "用中文回复。"
	}

	// Build the prompt
	prompt := fmt.Sprintf(`You are a helpful assistant that creates concise summaries for purchase request approvals.

Based on the following purchase request information, generate a brief summary (2-4 sentences) that explains:
1. What is being requested (the products)
2. The apparent purpose based on the justification provided
3. If the justification is unclear or missing, make a reasonable inference about potential use cases but note that the justification could be improved

Products requested:%s

Total amount: $%.2f

Justification provided by requester: "%s"

%s
Keep the summary professional and concise. Focus on helping the approver understand what is being requested and why.`, productInfo.String(), totalAmount, req.Justification, langInstruction)

	// Get Ollama URL from environment or use default
	ollamaURL := os.Getenv("OLLAMA_URL")
	if ollamaURL == "" {
		ollamaURL = "http://localhost:11434"
	}

	// Get model from environment or use default
	model := os.Getenv("OLLAMA_MODEL")
	if model == "" {
		model = "deepseek-r1:14b"
	}

	// Make request to Ollama
	ollamaReq := OllamaRequest{
		Model:  model,
		Prompt: prompt,
		Stream: false,
	}

	reqBody, err := json.Marshal(ollamaReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Post(ollamaURL+"/api/generate", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Failed to connect to Ollama. Make sure Ollama is running.",
			"details": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response"})
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "Ollama returned an error",
			"details": string(body),
		})
		return
	}

	var ollamaResp OllamaResponse
	if err := json.Unmarshal(body, &ollamaResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse Ollama response"})
		return
	}

	// Clean up the response - remove thinking tags if present (DeepSeek R1 format)
	summary := ollamaResp.Response
	// Remove <think>...</think> blocks
	if idx := strings.Index(summary, "<think>"); idx != -1 {
		if endIdx := strings.Index(summary, "</think>"); endIdx != -1 {
			summary = strings.TrimSpace(summary[endIdx+8:])
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"summary": strings.TrimSpace(summary),
		"model": ollamaResp.Model,
	})
}
