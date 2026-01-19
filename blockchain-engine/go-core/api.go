package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

// StartAPIServer starts the HTTP API server
func StartAPIServer(api *BlockchainAPI) {
	r := mux.NewRouter()

	// Define API routes as specified in the architecture
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		response := api.HealthCheck()
		json.NewEncoder(w).Encode(response)
	}).Methods("GET")

	r.HandleFunc("/blockchain", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		bc := api.GetBlockchain()
		json.NewEncoder(w).Encode(bc)
	}).Methods("GET")

	r.HandleFunc("/blockchain/length", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		length := api.GetBlockchainLength()
		response := map[string]interface{}{
			"length": length,
		}
		json.NewEncoder(w).Encode(response)
	}).Methods("GET")

	r.HandleFunc("/block/{index}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		vars := mux.Vars(r)
		indexStr := vars["index"]

		index, err := strconv.ParseUint(indexStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid block index", http.StatusBadRequest)
			return
		}

		block := api.GetBlockByIndex(index)
		if block == nil {
			http.Error(w, "Block not found", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(block)
	}).Methods("GET")

	r.HandleFunc("/transaction", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Payload  map[string]interface{} `json:"payload"`
			ActorGLN string                 `json:"actorGLN"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		txID := api.AddTransaction(req.Payload, req.ActorGLN)

		response := NewAPIResponse(true, map[string]string{"txId": txID}, "Transaction added successfully", "")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}).Methods("POST")

	r.HandleFunc("/mine", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			MinerAddress string `json:"minerAddress"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			// Use default miner address if not provided
			req.MinerAddress = "default_miner"
		}

		err := api.Mine(req.MinerAddress)
		if err != nil {
			response := NewAPIResponse(false, nil, "", err.Error())
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(response)
			return
		}

		response := NewAPIResponse(true, nil, "Block mined successfully", "")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}).Methods("POST")

	r.HandleFunc("/validate", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		result := api.Validate()
		json.NewEncoder(w).Encode(result)
	}).Methods("GET")

	// Additional endpoints for enhanced functionality
	r.HandleFunc("/balance/{address}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		address := vars["address"]

		balance := api.Blockchain.GetBalanceOfAddress(address)

		response := map[string]interface{}{
			"address": address,
			"balance": balance,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}).Methods("GET")

	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		info := map[string]interface{}{
			"name":        "E-Ledger Go Blockchain API",
			"version":     "1.0.0",
			"description": "Permissioned blockchain for supply chain management",
			"endpoints": []string{
				"GET  /health - Health check",
				"GET  /blockchain - Get entire blockchain",
				"GET  /blockchain/length - Get blockchain length",
				"GET  /block/{index} - Get block by index",
				"POST /transaction - Add new transaction",
				"POST /mine - Mine pending transactions",
				"GET  /validate - Validate blockchain",
				"GET  /balance/{address} - Get balance for address",
			},
		}
		json.NewEncoder(w).Encode(info)
	}).Methods("GET")

	port := ":8080"
	if envPort := strings.TrimSpace(strings.ToLower(os.Getenv("PORT"))); envPort != "" {
		if _, err := strconv.Atoi(envPort); err == nil {
			port = ":" + envPort
		}
	}

	fmt.Printf("E-Ledger Go Blockchain API server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(port, r))
}

// Main function to start the API server
func main() {
	api := NewBlockchainAPI()

	// Add some sample transactions for demonstration
	sampleTx1 := map[string]interface{}{
		"type":    "TRANSFER",
		"from":    "1234567890123",
		"to":      "9876543210987",
		"amount":  100,
		"product": "Whiskey Batch A-123",
	}

	txID1 := api.AddTransaction(sampleTx1, "1234567890123")
	fmt.Printf("Added sample transaction: %s\n", txID1)

	sampleTx2 := map[string]interface{}{
		"type":    "RECEIVE",
		"from":    "9876543210987",
		"to":      "5554443332221",
		"amount":  50,
		"product": "Whiskey Batch A-123",
	}

	txID2 := api.AddTransaction(sampleTx2, "9876543210987")
	fmt.Printf("Added sample transaction: %s\n", txID2)

	// Mine the pending transactions
	err := api.Mine("miner_1")
	if err != nil {
		fmt.Printf("Error mining block: %v\n", err)
	} else {
		fmt.Printf("Successfully mined block. Chain length: %d\n", api.GetBlockchainLength())
	}

	// Start the API server
	StartAPIServer(api)
}
