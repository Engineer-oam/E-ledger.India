use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use ring::signature;
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub payload: serde_json::Value,
    pub actor_gln: String,
    pub timestamp: String,
    pub signature: String,
    pub metadata: HashMap<String, String>,
    pub public_key: String,  // Added for PoA validation
}

impl Transaction {
    pub fn new(payload: serde_json::Value, actor_gln: String) -> Self {
        let timestamp = Utc::now().to_rfc3339();
        let id_input = format!("{}{}", 
            serde_json::to_string(&payload).unwrap_or_default(), 
            &actor_gln, 
            &timestamp
        );
        
        let mut hasher = Sha256::new();
        hasher.update(id_input.as_bytes());
        let id = format!("{:x}", hasher.finalize());

        // For MVP, simulate signature using hash
        let signature_input = format!("{}{}{}", &id, &actor_gln, &timestamp);
        let mut sig_hasher = Sha256::new();
        sig_hasher.update(signature_input.as_bytes());
        let signature = format!("{:x}", sig_hasher.finalize());

        Transaction {
            id,
            payload,
            actor_gln,
            timestamp,
            signature,
            metadata: HashMap::new(),
            public_key: String::new(), // Will be set by actual signing process
        }
    }

    pub fn calculate_hash(&self) -> String {
        let mut hasher = Sha256::new();
        let data = format!(
            "{}{}{}{}{:?}{}",
            &self.id, &self.actor_gln, &self.timestamp, &self.signature, &self.metadata, &self.public_key
        );
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: String,
    pub transactions: Vec<Transaction>,
    pub previous_hash: String,
    pub hash: String,
    pub nonce: u64,
    pub merkle_root: String,
    pub difficulty: u32,
    pub validator: String,  // GLN of the validator who created this block
    pub validator_signature: String,  // Digital signature of the validator
}

impl Block {
    pub fn new(index: u64, transactions: Vec<Transaction>, previous_hash: String, validator: String) -> Self {
        let timestamp = Utc::now().to_rfc3339();
        let merkle_root = Self::calculate_merkle_root(&transactions);
        
        // Initial block with zero nonce
        let mut block = Block {
            index,
            timestamp,
            transactions,
            previous_hash,
            hash: String::new(),
            nonce: 0,
            merkle_root,
            difficulty: 0, // Set to 0 for PoA (no mining needed)
            validator,
            validator_signature: String::new(), // Will be set after hash is calculated
        };

        // Calculate initial hash
        block.hash = block.calculate_hash();
        // Sign the block with validator's private key (simulated)
        block.validator_signature = Self::calculate_validator_signature(&block);

        block
    }

    pub fn calculate_hash(&self) -> String {
        let mut hasher = Sha256::new();
        let data = format!(
            "{}{}{}{}{}{}{}{}",
            self.index,
            &self.timestamp,
            &self.merkle_root,
            &self.previous_hash,
            self.nonce,
            serde_json::to_string(&self.transactions).unwrap_or_default(),
            &self.validator,
            &self.validator_signature
        );
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    fn calculate_validator_signature(block: &Block) -> String {
        let mut hasher = Sha256::new();
        let sig_input = format!("{}{}", &block.hash, &block.validator);
        hasher.update(sig_input.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub fn mine_block(&mut self) {
        // In PoA, no mining is needed, so this is a no-op
        // The validator signs the block instead of mining it
        self.nonce = 0;
        self.hash = self.calculate_hash();
        self.validator_signature = Self::calculate_validator_signature(self);
    }

    fn calculate_merkle_root(transactions: &[Transaction]) -> String {
        if transactions.is_empty() {
            return "0".repeat(64);
        }

        if transactions.len() == 1 {
            return transactions[0].calculate_hash();
        }

        let mut hashes: Vec<String> = transactions.iter()
            .map(|tx| tx.calculate_hash())
            .collect();

        while hashes.len() > 1 {
            let mut new_level = Vec::new();
            for chunk in hashes.chunks(2) {
                if chunk.len() == 2 {
                    let mut hasher = Sha256::new();
                    hasher.update(chunk[0].as_bytes());
                    hasher.update(chunk[1].as_bytes());
                    new_level.push(format!("{:x}", hasher.finalize()));
                } else {
                    // If odd number, duplicate the last hash
                    let mut hasher = Sha256::new();
                    hasher.update(chunk[0].as_bytes());
                    hasher.update(chunk[0].as_bytes());
                    new_level.push(format!("{:x}", hasher.finalize()));
                }
            }
            hashes = new_level;
        }

        hashes[0].clone()
    }
}

// Validator represents an authorized validator in the PoA network
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Validator {
    pub gln: String,
    pub public_key: String,
    pub private_key: Vec<u8>,  // Simplified for MVP
    pub active: bool,
    pub role: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Blockchain {
    pub chain: Vec<Block>,
    pub pending_transactions: Vec<Transaction>,
    pub difficulty: u32,
    pub validators: HashMap<String, Validator>, // Map of authorized validators (GLN -> Validator)
    pub threshold: u32,                       // Minimum number of validators needed for consensus
    pub current_round: u32,                   // Current consensus round
    pub next_validator: String,               // Next validator in the rotation
}

impl Blockchain {
    pub fn new() -> Self {
        let mut blockchain = Blockchain {
            chain: Vec::new(),
            pending_transactions: Vec::new(),
            difficulty: 0, // Set to 0 for PoA
            validators: HashMap::new(),
            threshold: 1,  // In PoA, typically 1 validator is enough
            current_round: 0,
            next_validator: String::new(),
        };
        
        // Add genesis block
        let genesis_block = blockchain.create_genesis_block();
        blockchain.chain.push(genesis_block);
        
        blockchain
    }

    fn create_genesis_block(&self) -> Block {
        let transactions = vec![Transaction::new(
            serde_json::json!({"type": "GENESIS", "message": "E-Ledger Rust Core Genesis Block"}),
            "0000000000000".to_string()
        )];
        
        let mut block = Block::new(0, transactions, "0".repeat(64), "SYSTEM_VALIDATOR".to_string());
        block.mine_block(); // Mine the genesis block
        
        block
    }

    pub fn get_latest_block(&self) -> Option<&Block> {
        self.chain.last()
    }

    pub fn add_transaction(&mut self, transaction: Transaction) {
        // Verify the transaction signature before adding
        if self.verify_transaction_signature(&transaction) {
            self.pending_transactions.push(transaction);
        }
    }

    // Add a new validator to the network
    pub fn add_validator(&mut self, gln: String, public_key: String, role: String) -> Result<(), String> {
        // Check if validator already exists
        if self.validators.contains_key(&gln) {
            return Err(format!("validator with GLN {} already exists", gln));
        }

        // Create a simplified private key for the validator (in real implementation, this would be securely generated and stored)
        let private_key = vec![0; 32]; // Placeholder for MVP
        
        let validator = Validator {
            gln: gln.clone(),
            public_key,
            private_key,
            active: true,
            role,
        };

        self.validators.insert(gln, validator);
        
        // Update threshold based on number of validators
        self.threshold = (self.validators.len() / 2) as u32 + 1;
        
        Ok(())
    }

    // Get the next validator in the rotation
    pub fn get_next_validator(&mut self) -> Option<Validator> {
        let active_validators: Vec<&Validator> = self.validators.values()
            .filter(|v| v.active)
            .collect();
        
        if active_validators.is_empty() {
            return None;
        }
        
        // Simple round-robin selection
        let index = (self.current_round % active_validators.len() as u32) as usize;
        self.current_round += 1;
        
        Some(active_validators[index].clone())
    }

    // Verify transaction signature
    pub fn verify_transaction_signature(&self, tx: &Transaction) -> bool {
        // For MVP, we'll use a simple hash-based verification
        // In a real implementation, this would use proper cryptographic signature verification
        let calculated_hash = format!("{:x}", Sha256::digest(
            format!("{:?}{}{}", tx.payload, tx.actor_gln, tx.timestamp).as_bytes()
        ));
        let expected_sig = format!("{:x}", Sha256::digest(
            format!("{}{}{}", calculated_hash, tx.actor_gln, tx.timestamp).as_bytes()
        ));
        
        tx.signature == expected_sig
    }

    // Verify block signature
    pub fn verify_block_signature(&self, block: &Block) -> bool {
        if let Some(validator) = self.validators.get(&block.validator) {
            let expected_sig = format!("{:x}", Sha256::digest(
                format!("{}{}", block.hash, block.validator).as_bytes()
            ));
            
            block.validator_signature == expected_sig
        } else {
            false
        }
    }

    pub fn mine_pending_transactions(&mut self, miner_address: String) -> Result<(), String> {
        // Check if the miner is a valid validator
        if let Some(validator) = self.validators.get(&miner_address) {
            if !validator.active {
                return Err(format!("miner {} is not an authorized validator", miner_address));
            }
        } else {
            return Err(format!("miner {} is not an authorized validator", miner_address));
        }

        if self.pending_transactions.is_empty() {
            return Err("No transactions to mine".to_string());
        }

        let latest_block = self.get_latest_block()
            .ok_or("No blocks in chain")?;

        let mut new_block = Block::new(
            latest_block.index + 1,
            self.pending_transactions.clone(),
            latest_block.hash.clone(),
            miner_address // Use miner_address as validator
        );

        new_block.mine_block();

        self.chain.push(new_block);
        self.pending_transactions.clear();

        // Reward the miner with a transaction
        let reward_tx = Transaction::new(
            serde_json::json!({
                "type": "REWARD",
                "amount": 1,
                "recipient": miner_address
            }),
            "SYSTEM".to_string()
        );
        
        self.pending_transactions.push(reward_tx);

        Ok(())
    }

    pub fn is_chain_valid(&self) -> bool {
        for i in 1..self.chain.len() {
            let current_block = &self.chain[i];
            let previous_block = &self.chain[i - 1];

            // Check if current block hash is valid
            if current_block.hash != current_block.calculate_hash() {
                println!("Invalid block hash at index {}", i);
                return false;
            }

            // Check if block is properly linked to previous block
            if current_block.previous_hash != previous_block.hash {
                println!("Invalid previous hash at index {}", i);
                return false;
            }

            // Validate the block signature (PoA validation)
            if !self.verify_block_signature(current_block) {
                println!("Invalid block signature at index {}", i);
                return false;
            }

            // Verify all transactions in the block
            for tx in &current_block.transactions {
                if !self.verify_transaction_signature(tx) {
                    println!("Invalid transaction signature in block at index {}", i);
                    return false;
                }
            }
        }

        true
    }

    pub fn get_balance_of_address(&self, address: &str) -> i32 {
        let mut balance = 0;

        for block in &self.chain {
            for transaction in &block.transactions {
                if transaction.actor_gln == address {
                    // Simplified logic - in real implementation, would check debits/credits
                    balance += 1;
                }
            }
        }

        balance
    }
}

// ... existing tests ...