package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

// Transaction represents a single transaction in the blockchain
type Transaction struct {
	ID        string                 `json:"id"`
	Payload   map[string]interface{} `json:"payload"`
	ActorGLN  string                 `json:"actorGLN"`
	Timestamp string                 `json:"timestamp"`
	Signature string                 `json:"signature"`
	Metadata  map[string]string      `json:"metadata"`
}

// NewTransaction creates a new transaction
func NewTransaction(payload map[string]interface{}, actorGLN string) *Transaction {
	timestamp := time.Now().Format(time.RFC3339)

	// Create ID by hashing the payload, actorGLN, and timestamp
	idInput := fmt.Sprintf("%v%s%s", payload, actorGLN, timestamp)
	id := calculateHash(idInput)

	// Create signature by hashing ID, actorGLN, and timestamp (simulated for MVP)
	sigInput := fmt.Sprintf("%s%s%s", id, actorGLN, timestamp)
	signature := calculateHash(sigInput)

	return &Transaction{
		ID:        id,
		Payload:   payload,
		ActorGLN:  actorGLN,
		Timestamp: timestamp,
		Signature: signature,
		Metadata:  make(map[string]string),
	}
}

// CalculateHash calculates the hash of the transaction
func (t *Transaction) CalculateHash() string {
	data := fmt.Sprintf("%s%s%s%s%v", t.ID, t.ActorGLN, t.Timestamp, t.Signature, t.Metadata)
	return calculateHash(data)
}

// Block represents a single block in the chain
type Block struct {
	Index        uint64        `json:"index"`
	Timestamp    string        `json:"timestamp"`
	Transactions []Transaction `json:"transactions"`
	PreviousHash string        `json:"previousHash"`
	Hash         string        `json:"hash"`
	Nonce        uint64        `json:"nonce"`
	MerkleRoot   string        `json:"merkleRoot"`
	Difficulty   uint32        `json:"difficulty"`
}

// NewBlock creates a new block
func NewBlock(index uint64, transactions []Transaction, previousHash string) *Block {
	timestamp := time.Now().Format(time.RFC3339)
	merkleRoot := calculateMerkleRoot(transactions)

	block := &Block{
		Index:        index,
		Timestamp:    timestamp,
		Transactions: transactions,
		PreviousHash: previousHash,
		Hash:         "",
		Nonce:        0,
		MerkleRoot:   merkleRoot,
		Difficulty:   4, // Fixed difficulty for MVP
	}

	// Calculate initial hash
	block.Hash = block.CalculateHash()

	return block
}

// CalculateHash calculates the hash of the block
func (b *Block) CalculateHash() string {
	data := fmt.Sprintf("%d%s%s%s%d%v",
		b.Index,
		b.Timestamp,
		b.MerkleRoot,
		b.PreviousHash,
		b.Nonce,
		b.Transactions)
	return calculateHash(data)
}

// MineBlock performs proof-of-work mining
func (b *Block) MineBlock() {
	for {
		b.Hash = b.CalculateHash()

		// Check if hash meets difficulty requirement
		if b.Hash[:b.Difficulty] == "0000"[:b.Difficulty] {
			break
		}

		b.Nonce++
	}
}

// calculateMerkleRoot calculates the Merkle root of the transactions
func calculateMerkleRoot(transactions []Transaction) string {
	if len(transactions) == 0 {
		return "0000000000000000000000000000000000000000000000000000000000000000" // 64 zeros
	}

	if len(transactions) == 1 {
		return transactions[0].CalculateHash()
	}

	var hashes []string
	for _, tx := range transactions {
		hashes = append(hashes, tx.CalculateHash())
	}

	for len(hashes) > 1 {
		var newLevel []string
		for i := 0; i < len(hashes); i += 2 {
			left := hashes[i]
			right := left // If odd number, duplicate the last hash

			if i+1 < len(hashes) {
				right = hashes[i+1]
			}

			combined := left + right
			newLevel = append(newLevel, calculateHash(combined))
		}
		hashes = newLevel
	}

	return hashes[0]
}

// Blockchain manages the entire chain
type Blockchain struct {
	Chain               []*Block      `json:"chain"`
	PendingTransactions []Transaction `json:"pendingTransactions"`
	Difficulty          uint32        `json:"difficulty"`
}

// NewBlockchain creates a new blockchain with genesis block
func NewBlockchain() *Blockchain {
	blockchain := &Blockchain{
		Chain:               make([]*Block, 0),
		PendingTransactions: make([]Transaction, 0),
		Difficulty:          4,
	}

	// Add genesis block
	genesisBlock := blockchain.createGenesisBlock()
	blockchain.Chain = append(blockchain.Chain, genesisBlock)

	return blockchain
}

// createGenesisBlock creates the genesis block
func (bc *Blockchain) createGenesisBlock() *Block {
	payload := map[string]interface{}{
		"type":    "GENESIS",
		"message": "E-Ledger Go Core Genesis Block",
	}

	transaction := *NewTransaction(payload, "0000000000000")
	transactions := []Transaction{transaction}

	block := NewBlock(0, transactions, "0000000000000000000000000000000000000000000000000000000000000000")
	block.MineBlock() // Mine the genesis block

	return block
}

// GetLatestBlock returns the latest block in the chain
func (bc *Blockchain) GetLatestBlock() *Block {
	if len(bc.Chain) == 0 {
		return nil
	}
	return bc.Chain[len(bc.Chain)-1]
}

// AddTransaction adds a transaction to pending transactions
func (bc *Blockchain) AddTransaction(transaction Transaction) {
	bc.PendingTransactions = append(bc.PendingTransactions, transaction)
}

// MinePendingTransactions mines pending transactions into a new block
func (bc *Blockchain) MinePendingTransactions(minerAddress string) error {
	if len(bc.PendingTransactions) == 0 {
		return fmt.Errorf("no transactions to mine")
	}

	latestBlock := bc.GetLatestBlock()
	if latestBlock == nil {
		return fmt.Errorf("no blocks in chain")
	}

	newBlock := NewBlock(
		latestBlock.Index+1,
		bc.PendingTransactions,
		latestBlock.Hash,
	)

	newBlock.MineBlock()
	bc.Chain = append(bc.Chain, newBlock)
	bc.PendingTransactions = make([]Transaction, 0)

	// Reward the miner with a transaction
	rewardPayload := map[string]interface{}{
		"type":      "REWARD",
		"amount":    1,
		"recipient": minerAddress,
	}

	rewardTx := *NewTransaction(rewardPayload, "SYSTEM")
	bc.AddTransaction(rewardTx)

	return nil
}

// IsChainValid validates the entire blockchain
func (bc *Blockchain) IsChainValid() bool {
	for i := 1; i < len(bc.Chain); i++ {
		currentBlock := bc.Chain[i]
		previousBlock := bc.Chain[i-1]

		// Check if current block hash is valid
		if currentBlock.Hash != currentBlock.CalculateHash() {
			fmt.Printf("Invalid block hash at index %d\n", i)
			return false
		}

		// Check if block is properly linked to previous block
		if currentBlock.PreviousHash != previousBlock.Hash {
			fmt.Printf("Invalid previous hash at index %d\n", i)
			return false
		}
	}

	return true
}

// GetBalanceOfAddress gets the balance of an address
func (bc *Blockchain) GetBalanceOfAddress(address string) int {
	balance := 0

	for _, block := range bc.Chain {
		for _, transaction := range block.Transactions {
			if transaction.ActorGLN == address {
				// Simplified logic - in real implementation, would check debits/credits
				balance++
			}
		}
	}

	return balance
}

// BlockchainAPI provides HTTP API wrapper with REST endpoints
type BlockchainAPI struct {
	Blockchain *Blockchain `json:"blockchain"`
}

// NewBlockchainAPI creates a new blockchain API
func NewBlockchainAPI() *BlockchainAPI {
	return &BlockchainAPI{
		Blockchain: NewBlockchain(),
	}
}

// HealthCheck returns health status
func (api *BlockchainAPI) HealthCheck() map[string]interface{} {
	return map[string]interface{}{
		"status":  "healthy",
		"uptime":  time.Now().Unix(),
		"network": "E-Ledger Go Core",
	}
}

// GetBlockchain returns the entire blockchain
func (api *BlockchainAPI) GetBlockchain() *Blockchain {
	return api.Blockchain
}

// GetBlockchainLength returns the length of the blockchain
func (api *BlockchainAPI) GetBlockchainLength() int {
	return len(api.Blockchain.Chain)
}

// GetBlockByIndex returns a block by its index
func (api *BlockchainAPI) GetBlockByIndex(index uint64) *Block {
	if index >= uint64(len(api.Blockchain.Chain)) {
		return nil
	}
	return api.Blockchain.Chain[index]
}

// AddTransaction adds a new transaction to pending transactions
func (api *BlockchainAPI) AddTransaction(payload map[string]interface{}, actorGLN string) string {
	transaction := *NewTransaction(payload, actorGLN)
	api.Blockchain.AddTransaction(transaction)
	return transaction.ID
}

// Mine mines pending transactions into a new block
func (api *BlockchainAPI) Mine(minerAddress string) error {
	return api.Blockchain.MinePendingTransactions(minerAddress)
}

// Validate validates the entire blockchain
func (api *BlockchainAPI) Validate() map[string]interface{} {
	isValid := api.Blockchain.IsChainValid()

	return map[string]interface{}{
		"valid":  isValid,
		"height": len(api.Blockchain.Chain),
	}
}

// APIResponse standardizes API response format
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// NewAPIResponse creates a new API response
func NewAPIResponse(success bool, data interface{}, message string, err string) *APIResponse {
	return &APIResponse{
		Success: success,
		Data:    data,
		Message: message,
		Error:   err,
	}
}

// calculateHash computes the SHA-256 hash of the input string
func calculateHash(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}

// String returns a string representation of the blockchain
func (bc *Blockchain) String() string {
	data, _ := json.MarshalIndent(bc, "", "  ")
	return string(data)
}

// String returns a string representation of the block
func (b *Block) String() string {
	data, _ := json.MarshalIndent(b, "", "  ")
	return string(data)
}

// String returns a string representation of the transaction
func (t *Transaction) String() string {
	data, _ := json.MarshalIndent(t, "", "  ")
	return string(data)
}

// String returns a string representation of the API response
func (ar *APIResponse) String() string {
	data, _ := json.MarshalIndent(ar, "", "  ")
	return string(data)
}
