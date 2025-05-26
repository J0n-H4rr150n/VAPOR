// VAPOR Lab - main.go - v1.2.0
// Date: May 26, 2025
// Changelog:
//  - Removed placeholder API handlers for platforms, targets, synack as they are not in the simplified UI.
//  - Kept core structure for serving index.html, static files, and the VAPOR LLM process endpoint.
//  - Removed all Go comments.

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
)

const ollamaAPIURL = "http://localhost:11434/api/generate"
const modelToUse = "llama3"
const webAppPort = "8778"

type FrontendResponse struct {
	UserInput   string `json:"UserInput,omitempty"`
	LLMResponse string `json:"LLMResponse,omitempty"`
	Error       string `json:"Error,omitempty"`
}

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

type OllamaResponse struct {
	Model     string `json:"model"`
	CreatedAt string `json:"created_at"`
	Response  string `json:"response"`
	Done      bool   `json:"done"`
}

var tmpl *template.Template

func init() {
	tmpl = template.Must(template.ParseFiles(filepath.Join("templates", "index.html")))
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	initialData := FrontendResponse{}
	err := tmpl.Execute(w, initialData)
	if err != nil {
		log.Printf("Error executing template: %v", err)
		http.Error(w, "Internal Server Error: "+err.Error(), http.StatusInternalServerError)
	}
}

func queryOllama(userInput string) (string, error) {
	fullPrompt := userInput
	log.Printf("Sending prompt to Ollama (model: %s): \"%s\"", modelToUse, fullPrompt)

	requestBody := OllamaRequest{
		Model:  modelToUse,
		Prompt: fullPrompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Ollama request: %w", err)
	}

	resp, err := http.Post(ollamaAPIURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to send request to Ollama: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Ollama response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Ollama API request failed with status %s: %s", resp.Status, string(bodyBytes))
	}

	var ollamaResp OllamaResponse
	if err := json.Unmarshal(bodyBytes, &ollamaResp); err != nil {
		return "", fmt.Errorf("failed to decode Ollama JSON response: %w. Body: %s", err, string(bodyBytes))
	}

	return ollamaResp.Response, nil
}

func vaporLlmProcessHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseForm(); err != nil {
		log.Printf("VAPOR LLM: Error parsing form: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(FrontendResponse{Error: "Error parsing form data"})
		return
	}
	userInput := r.FormValue("user_input")

	frontendResp := FrontendResponse{UserInput: userInput}

	if userInput == "" {
		frontendResp.Error = "Prompt input cannot be empty."
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(frontendResp)
		return
	}

	log.Printf("VAPOR LLM: Received user prompt: \"%s\"", userInput)
	llmResponseText, err := queryOllama(userInput)

	if err != nil {
		log.Printf("VAPOR LLM: Error querying Ollama: %v", err)
		frontendResp.Error = err.Error()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(frontendResp)
		return
	}

	log.Printf("VAPOR LLM: Response received (length: %d)", len(llmResponseText))
	frontendResp.LLMResponse = llmResponseText

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(frontendResp)
}

func main() {
	staticDir := "./static"
	fs := http.FileServer(http.Dir(staticDir))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	log.Printf("Serving static files from %s on /static/", staticDir)

	http.HandleFunc("/", indexHandler)
	http.HandleFunc("/api/vapor/llm/process", vaporLlmProcessHandler)

	log.Printf("Starting VAPOR Lab Go Web App on http://localhost:%s\n", webAppPort)
	err := http.ListenAndServe(":"+webAppPort, nil)
	if err != nil {
		log.Fatal("ListenAndServe Error: ", err)
	}
}
