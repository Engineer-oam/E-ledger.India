# E-Ledger Blockchain Core Implementation

This repository contains the blockchain core implementations for the E-Ledger supply chain management platform, built in both Rust and Go as specified in the architecture.

## Architecture Overview

The blockchain core consists of two implementations:
- **Rust Implementation**: High-performance, memory-safe implementation in `blockchain-engine/rust-core`
- **Go Implementation**: Production-ready API-focused implementation in `blockchain-engine/go-core`

Both implementations follow the same core architecture with:
- Transaction and Block structures
- Proof of Authority (PoA) consensus
- Merkle tree transaction validation
- Peer-to-peer networking capabilities
- Enterprise-grade security features

## Prerequisites

### For Rust Implementation
- Rust 1.70 or higher
- Cargo (comes with Rust)

### For Go Implementation
- Go 1.21 or higher
- Git (for dependency management)

## Setup Instructions

### Rust Implementation

1. Navigate to the Rust implementation directory:
```bash
cd blockchain-engine/rust-core
```

2. Build the project:
```bash
cargo build --release
```

3. Run the implementation:
```bash
cargo run
```

### Go Implementation

1. Navigate to the Go implementation directory:
```bash
cd blockchain-engine/go-core
```

2. Install dependencies:
```bash
go mod tidy
```

3. Run the implementation:
```bash
go run *.go
```

The Go implementation will start an API server on `http://localhost:8080` with the following endpoints:
- `GET /health` - Health check
- `GET /blockchain` - Get entire blockchain
- `GET /blockchain/length` - Get blockchain length
- `GET /block/{index}` - Get block by index
- `POST /transaction` - Add a transaction
- `POST /mine` - Mine pending transactions
- `GET /validate` - Validate blockchain

## Using Makefile (Alternative)

If you have `make` installed, you can use the provided Makefile:

```bash
# View available commands
make help

# Build both implementations
make all

# Run Rust implementation
make rust-run

# Run Go implementation
make go-run

# Install dependencies
make deps
```

## Key Features

### Transaction Structure
- GLN-based actor identification
- Flexible payload for business logic
- Cryptographic signatures
- Metadata for traceability

### Block Structure
- Merkle tree for transaction integrity
- Proof of Authority consensus
- Chain integrity verification
- Timestamp-based ordering

### Network Capabilities
- Peer-to-peer communication
- Transaction broadcasting
- Block propagation
- Validator management

## Security Features

- Permissioned network access
- GLN-based identity verification
- Cryptographic transaction signing
- Immutable blockchain storage
- Merkle tree validation

## Integration Points

The blockchain core is designed to integrate with:
- Frontend applications via REST API
- ERP systems for batch tracking
- Compliance systems for audit trails
- Third-party logistics providers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.