use e_ledger_rust_core::{DistributedLedger, Transaction};
use serde_json::json;
use std::env;

fn main() {
    println!("Starting E-Ledger Rust Blockchain Core...");

    // Initialize the distributed ledger
    let mut ledger = DistributedLedger::new();
    
    // Add some sample validators
    ledger.add_validator("1234567890123".to_string());
    ledger.add_validator("2345678901234".to_string());
    ledger.add_validator("3456789012345".to_string());
    
    // Add some sample peers
    ledger.add_peer("http://node1.eledger.network:8080".to_string());
    ledger.add_peer("http://node2.eledger.network:8080".to_string());
    
    // Create a sample transaction
    let transaction_data = json!({
        "type": "TRANSFER",
        "from": "1234567890123",
        "to": "9876543210987",
        "amount": 100,
        "product": "Whiskey Batch A-123"
    });
    
    let transaction = Transaction::new(
        transaction_data,
        "1234567890123".to_string()
    );
    
    println!("Created transaction: {}", transaction.id);
    println!("Transaction hash: {}", transaction.calculate_hash());
    
    // Add the transaction to the ledger
    match ledger.validate_and_broadcast_transaction(transaction) {
        Ok(_) => println!("Transaction validated and added to pending transactions"),
        Err(e) => println!("Error adding transaction: {}", e),
    }
    
    // Mine a block with the pending transactions
    match ledger.blockchain.mine_pending_transactions("validator_node_1".to_string()) {
        Ok(_) => {
            let latest_block = ledger.blockchain.get_latest_block().unwrap();
            println!("Block mined successfully! Index: {}, Hash: {}", latest_block.index, latest_block.hash);
        },
        Err(e) => println!("Error mining block: {}", e),
    }
    
    // Verify the chain integrity
    if ledger.blockchain.is_chain_valid() {
        println!("Blockchain integrity: VALID");
    } else {
        println!("Blockchain integrity: INVALID");
    }
    
    // Print blockchain stats
    println!("Blockchain length: {}", ledger.blockchain.chain.len());
    println!("Pending transactions: {}", ledger.blockchain.pending_transactions.len());
    
    // Get balance for an address
    let balance = ledger.blockchain.get_balance_of_address("1234567890123");
    println!("Balance for 1234567890123: {}", balance);
    
    // Check if arguments were passed for additional operations
    let args: Vec<String> = env::args().collect();
    if args.len() > 1 {
        match args[1].as_str() {
            "help" | "--help" | "-h" => {
                println!("\nE-Ledger Rust Core Commands:");
                println!("  cargo run --bin e-ledger-rust-core                    # Run the default demo");
                println!("  cargo run --bin e-ledger-rust-core help              # Show this help");
                println!("  cargo run --bin e-ledger-rust-core stats             # Show blockchain statistics");
                println!("  cargo run --bin e-ledger-rust-core mine <miner_addr> # Mine a new block");
            }
            "stats" => {
                println!("\nBlockchain Statistics:");
                println!("  Total blocks: {}", ledger.blockchain.chain.len());
                println!("  Total transactions: {}", 
                    ledger.blockchain.chain.iter()
                        .map(|block| block.transactions.len())
                        .sum::<usize>());
                println!("  Validators: {}", ledger.consensus_state.validators.len());
                println!("  Peers: {}", ledger.peers.len());
            }
            "mine" => {
                if args.len() >= 3 {
                    let miner_addr = &args[2];
                    match ledger.blockchain.mine_pending_transactions(miner_addr.to_string()) {
                        Ok(_) => {
                            let latest_block = ledger.blockchain.get_latest_block().unwrap();
                            println!("New block mined! Index: {}, Hash: {}", latest_block.index, latest_block.hash);
                        }
                        Err(e) => println!("Failed to mine block: {}", e),
                    }
                } else {
                    println!("Usage: cargo run --bin e-ledger-rust-core mine <miner_address>");
                }
            }
            _ => {
                println!("Unknown command: {}", args[1]);
                println!("Run with 'help' to see available commands");
            }
        }
    }
}