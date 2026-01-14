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
	"vista-backend/pkg/response"
)

type AISummaryHandler struct{}

func NewAISummaryHandler() *AISummaryHandler {
	return &AISummaryHandler{}
}

type SummaryRequest struct {
	Items           []SummaryItem `json:"items"`
	Justification   string        `json:"justification"`
	Language        string        `json:"language"`
	Question        string        `json:"question"`
	PreviousSummary string        `json:"previousSummary"`
	Stream          bool          `json:"stream"`
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
	Model    string `json:"model"`
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

type OllamaStreamResponse struct {
	Model    string `json:"model"`
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

func (h *AISummaryHandler) GenerateSummary(c *gin.Context) {
	var req SummaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
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

	// Build the prompt based on whether this is a question or initial summary
	var prompt string

	if req.Question != "" {
		// Follow-up question mode
		prompt = fmt.Sprintf(`You are a helpful assistant helping a manager review a purchase request.

Previous context about the request:
%s

Products in this request:%s

Total amount: $%.2f

Justification: "%s"

The manager is asking: "%s"

%s
Provide a helpful, concise answer to the manager's question. If you don't have enough information to answer, say so clearly.`, req.PreviousSummary, productInfo.String(), totalAmount, req.Justification, req.Question, langInstruction)
	} else {
		// Initial summary mode
		prompt = fmt.Sprintf(`You are a helpful assistant that creates concise summaries for purchase request approvals.

Based on the following purchase request information, generate a brief summary (2-4 sentences) that explains:
1. What is being requested (the products)
2. The apparent purpose based on the justification provided
3. If the justification is unclear or missing, make a reasonable inference about potential use cases but note that the justification could be improved

Products requested:%s

Total amount: $%.2f

Justification provided by requester: "%s"

%s
Keep the summary professional and concise. Focus on helping the approver understand what is being requested and why.`, productInfo.String(), totalAmount, req.Justification, langInstruction)
	}

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

	// Check if streaming is requested
	if req.Stream {
		h.handleStreamingRequest(c, prompt, ollamaURL, model)
		return
	}

	// Make request to Ollama
	ollamaReq := OllamaRequest{
		Model:  model,
		Prompt: prompt,
		Stream: false,
	}

	reqBody, err := json.Marshal(ollamaReq)
	if err != nil {
		response.InternalServerError(c, "Failed to create request")
		return
	}

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Post(ollamaURL+"/api/generate", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		response.ErrorWithDetails(c, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE",
			"Failed to connect to Ollama. Make sure Ollama is running.", err.Error())
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		response.InternalServerError(c, "Failed to read response")
		return
	}

	if resp.StatusCode != http.StatusOK {
		response.ErrorWithDetails(c, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE",
			"Ollama returned an error", string(body))
		return
	}

	var ollamaResp OllamaResponse
	if err := json.Unmarshal(body, &ollamaResp); err != nil {
		response.InternalServerError(c, "Failed to parse Ollama response")
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

	response.Success(c, gin.H{
		"summary": strings.TrimSpace(summary),
		"model":   ollamaResp.Model,
	})
}

// handleStreamingRequest handles streaming responses from Ollama
func (h *AISummaryHandler) handleStreamingRequest(c *gin.Context, prompt, ollamaURL, model string) {
	// Set headers for SSE
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")

	// Make streaming request to Ollama
	ollamaReq := OllamaRequest{
		Model:  model,
		Prompt: prompt,
		Stream: true,
	}

	reqBody, err := json.Marshal(ollamaReq)
	if err != nil {
		c.SSEvent("error", "Failed to create request")
		return
	}

	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Post(ollamaURL+"/api/generate", "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		c.SSEvent("error", "Failed to connect to Ollama")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.SSEvent("error", "Ollama returned an error")
		return
	}

	// Send thinking indicator
	c.Writer.Write([]byte("data: [THINKING]\n\n"))
	c.Writer.Flush()

	decoder := json.NewDecoder(resp.Body)
	var fullResponse strings.Builder
	inThinkingBlock := false
	sentResponding := false

	for {
		var streamResp OllamaStreamResponse
		if err := decoder.Decode(&streamResp); err != nil {
			if err == io.EOF {
				break
			}
			break
		}

		content := streamResp.Response
		fullResponse.WriteString(content)

		// Track thinking blocks
		if strings.Contains(fullResponse.String(), "<think>") && !strings.Contains(fullResponse.String(), "</think>") {
			inThinkingBlock = true
		}
		if strings.Contains(fullResponse.String(), "</think>") {
			inThinkingBlock = false
			if !sentResponding {
				c.Writer.Write([]byte("data: [RESPONDING]\n\n"))
				c.Writer.Flush()
				sentResponding = true
			}
			continue
		}

		// Only send content if we're not in a thinking block
		if !inThinkingBlock && sentResponding && content != "" {
			jsonContent, _ := json.Marshal(map[string]string{"content": content})
			c.Writer.Write([]byte(fmt.Sprintf("data: %s\n\n", jsonContent)))
			c.Writer.Flush()
		}

		if streamResp.Done {
			break
		}
	}

	// Clean final response for non-streaming fallback
	finalResponse := fullResponse.String()
	if idx := strings.Index(finalResponse, "</think>"); idx != -1 {
		finalResponse = strings.TrimSpace(finalResponse[idx+8:])
	}

	// Send final content if no streaming happened
	if !sentResponding && finalResponse != "" {
		c.Writer.Write([]byte("data: [RESPONDING]\n\n"))
		jsonContent, _ := json.Marshal(map[string]string{"content": finalResponse})
		c.Writer.Write([]byte(fmt.Sprintf("data: %s\n\n", jsonContent)))
		c.Writer.Flush()
	}

	c.Writer.Write([]byte("data: [DONE]\n\n"))
	c.Writer.Flush()
}
