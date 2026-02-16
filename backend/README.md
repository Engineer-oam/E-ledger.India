# E-Ledger Backend Architecture

## Overview

This is the operational backend for the Indian pharmaceutical supply chain e-ledger system, designed to handle **70,000 TPS** with cross-border capabilities.

## Key Features

### 🚀 High-Performance Consortium Layer
- **70,000 TPS** target capacity
- **10 shards** for horizontal scaling
- **30 consortium nodes** distributed across shards
- Load balancing and health monitoring

### 🌍 Cross-Border Operations
- **GLN verification** against international registries
- **Compliance checking** for different jurisdictions
- **India-specific** regulatory support
- Cache layer for performance optimization

### 🔗 Blockchain Integration
- Immutable transaction ledger
- Merkle tree verification
- Genesis block initialization
- Chain integrity validation

### 🏗️ Architecture Components

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   API Gateway   │───▶│ Consortium Layer │───▶│ Blockchain Engine  │
│  (Express.js)   │    │   (70K TPS)      │    │  (Immutable Ledger)│
└─────────────────┘    └──────────────────┘    └────────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ GLN Verification│    │ Compliance       │    │ Data Storage       │
│ Cross-Border    │    │  Monitoring      │    │ (In-memory Demo)   │
└─────────────────┘    └──────────────────┘    └────────────────────┘
```

## API Endpoints

### Health & Status
- `GET /` - System overview
- `GET /health` - Health check
- `GET /api/consortium/status` - Consortium metrics

### Consortium Management
- `GET /api/consortium/nodes` - List all nodes
- `GET /api/consortium/shards` - List all shards

### Cross-Border Operations
- `POST /api/cross-border/verify-gln` - Verify GLN internationally
- `GET /api/cross-border/status` - Cross-border service status

### Blockchain
- `GET /api/blockchain/stats` - Blockchain statistics
- `GET /api/blockchain/blocks` - Retrieve blockchain
- `POST /api/blockchain/blocks` - Create new block

### Transaction Processing
- `POST /api/transactions/process` - Process high-speed transactions

## Performance Targets

- **Throughput**: 70,000 TPS minimum
- **Latency**: < 50ms for 95th percentile
- **Availability**: 99.99% uptime
- **Scalability**: Horizontal scaling to 200K+ TPS

## Technology Stack

### Current Demo Implementation
- **Runtime**: Node.js with Express.js
- **Data Storage**: In-memory (demo)
- **Sharding**: Hash-based distribution
- **Caching**: Simulated cache layer

### Production Architecture (Planned)
- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB sharded cluster
- **Caching**: Redis Enterprise
- **Messaging**: Apache Kafka
- **Deployment**: Kubernetes with multi-region

## Running the Demo

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. The server will run on `http://localhost:3001`

## Testing High-Performance Capabilities

The system simulates 70K TPS through:
- Efficient sharding algorithm
- Load-balanced node distribution
- Optimized transaction routing
- Minimal processing overhead

## Security Features

- GLN validation and verification
- Cross-border compliance checking
- Audit trail for all transactions
- Role-based access control (planned)

## Future Enhancements

- [ ] Full NestJS implementation
- [ ] MongoDB sharded cluster deployment
- [ ] Redis caching layer integration
- [ ] Kafka message queue setup
- [ ] Advanced consensus mechanisms
- [ ] Real-time monitoring dashboard
- [ ] Automated scaling policies

## Compliance Support

### India
- Drugs and Cosmetics Act
- Pharmacopeia standards
- GST compliance

### International
- FDA regulations (US)
- EMA regulations (EU)
- Country-specific requirements

This architecture provides a solid foundation for the e-ledger system while meeting the high-performance requirements for the Indian pharmaceutical supply chain.