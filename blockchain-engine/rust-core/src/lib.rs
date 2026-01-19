pub mod blockchain;
pub mod auth;

pub use blockchain::{Blockchain, Block, Transaction, Validator};
pub use auth::{AuthService, User, Role, CreateUserRequest};

// DistributedLedger extends blockchain with networking and consensus capabilities
pub struct DistributedLedger {
    pub blockchain: Blockchain,
    pub peers: Vec<String>,
    pub consensus_state: ConsensusState,
    pub auth_service: AuthService, // Add authentication service
}

#[derive(Debug, Clone)]
pub struct ConsensusState {
    pub validators: Vec<String>,
    pub current_round: u64,
    pub threshold: u32,
}

impl DistributedLedger {
    pub fn new() -> Self {
        DistributedLedger {
            blockchain: Blockchain::new(),
            peers: Vec::new(),
            consensus_state: ConsensusState {
                validators: Vec::new(),
                current_round: 0,
                threshold: 0,
            },
            auth_service: AuthService::new(), // Initialize auth service
        }
    }

    pub fn add_peer(&mut self, peer_addr: String) {
        if !self.peers.contains(&peer_addr) {
            self.peers.push(peer_addr);
        }
    }

    pub fn add_validator(&mut self, validator_gln: String) {
        if !self.consensus_state.validators.contains(&validator_gln) {
            self.consensus_state.validators.push(validator_gln);
            self.consensus_state.threshold = (self.consensus_state.validators.len() as u32 * 2 / 3) + 1;
        }
    }

    pub fn validate_and_broadcast_transaction(&mut self, transaction: Transaction) -> Result<(), String> {
        // Validate the transaction
        if transaction.id.is_empty() {
            return Err("Invalid transaction ID".to_string());
        }

        // Add to pending transactions
        self.blockchain.add_transaction(transaction);

        // In a real implementation, we would broadcast to peers here
        // For MVP, we just return success
        Ok(())
    }

    // Add PoA-specific methods
    pub fn add_poa_validator(&mut self, gln: String, public_key: String, role: String) -> Result<(), String> {
        self.blockchain.add_validator(gln, public_key, role)
    }

    pub fn mine_with_poa(&mut self, validator_address: String) -> Result<(), String> {
        self.blockchain.mine_pending_transactions(validator_address)
    }
}

// NetworkPeer represents a peer node in the network
#[derive(Debug, Clone)]
pub struct NetworkPeer {
    pub id: String,
    pub address: String,
    pub gln: String,
    pub is_validator: bool,
    pub last_seen: chrono::DateTime<chrono::Utc>,
}

impl NetworkPeer {
    pub fn new(address: String, gln: String, is_validator: bool) -> Self {
        NetworkPeer {
            id: uuid::Uuid::new_v4().to_string(),
            address,
            gln,
            is_validator,
            last_seen: chrono::Utc::now(),
        }
    }
}

// Re-export commonly used items
pub use blockchain::*;