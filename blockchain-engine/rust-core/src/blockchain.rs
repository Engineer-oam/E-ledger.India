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
}

impl Transaction {
    pub fn new(payload: serde_json::Value, actor_gln: String) -> Self {
        let timestamp = Utc::now().to_rfc3339();
        let id_input = format!("{}{}{}", 
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
        }
    }

    pub fn calculate_hash(&self) -> String {
        let mut hasher = Sha256::new();
        let data = format!(
            "{}{}{}{}{:?}",
            &self.id, &self.actor_gln, &self.timestamp, &self.signature, &self.metadata
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
}

impl Block {
    pub fn new(index: u64, transactions: Vec<Transaction>, previous_hash: String) -> Self {
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
            difficulty: 4, // Fixed difficulty for MVP
        };

        // Calculate initial hash
        block.hash = block.calculate_hash();

        block
    }

    pub fn calculate_hash(&self) -> String {
        let mut hasher = Sha256::new();
        let data = format!(
            "{}{}{}{}{}{}",
            self.index,
            &self.timestamp,
            &self.merkle_root,
            &self.previous_hash,
            self.nonce,
            serde_json::to_string(&self.transactions).unwrap_or_default()
        );
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub fn mine_block(&mut self) {
        // Simple proof-of-work for MVP
        loop {
            self.hash = self.calculate_hash();
            
            // Check if hash meets difficulty requirement
            if self.hash.starts_with(&"0".repeat(self.difficulty as usize)) {
                break;
            }
            
            self.nonce += 1;
        }
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Blockchain {
    pub chain: Vec<Block>,
    pub pending_transactions: Vec<Transaction>,
    pub difficulty: u32,
}

impl Blockchain {
    pub fn new() -> Self {
        let mut blockchain = Blockchain {
            chain: Vec::new(),
            pending_transactions: Vec::new(),
            difficulty: 4,
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
        
        let mut block = Block::new(0, transactions, "0".repeat(64));
        block.mine_block(); // Mine the genesis block
        
        block
    }

    pub fn get_latest_block(&self) -> Option<&Block> {
        self.chain.last()
    }

    pub fn add_transaction(&mut self, transaction: Transaction) {
        self.pending_transactions.push(transaction);
    }

    pub fn mine_pending_transactions(&mut self, miner_address: String) -> Result<(), String> {
        if self.pending_transactions.is_empty() {
            return Err("No transactions to mine".to_string());
        }

        let latest_block = self.get_latest_block()
            .ok_or("No blocks in chain")?;

        let mut new_block = Block::new(
            latest_block.index + 1,
            self.pending_transactions.clone(),
            latest_block.hash.clone()
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_genesis_block() {
        let blockchain = Blockchain::new();
        assert_eq!(blockchain.chain.len(), 1);
        assert_eq!(blockchain.chain[0].index, 0);
    }

    #[test]
    fn test_add_block() {
        let mut blockchain = Blockchain::new();
        
        let transaction = Transaction::new(
            serde_json::json!({"sender": "A", "receiver": "B", "amount": 10}),
            "1234567890123".to_string()
        );
        
        blockchain.add_transaction(transaction);
        let result = blockchain.mine_pending_transactions("miner1".to_string());
        assert!(result.is_ok());
        assert_eq!(blockchain.chain.len(), 2);
    }

    #[test]
    fn test_invalid_chain() {
        let mut blockchain = Blockchain::new();
        
        let transaction = Transaction::new(
            serde_json::json!({"sender": "A", "receiver": "B", "amount": 10}),
            "1234567890123".to_string()
        );
        
        blockchain.add_transaction(transaction);
        let _ = blockchain.mine_pending_transactions("miner1".to_string());
        
        // Tamper with the first block
        blockchain.chain[1].nonce = 999999;
        
        assert!(!blockchain.is_chain_valid());
    }
}