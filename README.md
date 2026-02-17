# E-Ledger India

## Overview
E-Ledger is a high-performance blockchain-based supply chain tracking system designed for the Indian pharmaceutical industry. The system is built to handle 70,000 TPS (transactions per second) with cross-border capabilities and GLN (Global Location Number) verification.

## Features
- **High Performance**: Designed for 70,000 TPS capacity with sharding support
- **Blockchain Integration**: Immutable transaction ledger with Merkle tree verification
- **Cross-Border Operations**: GLN verification against international registries
- **Compliance**: India-specific regulatory support (Drugs & Cosmetics Act)
- **ERP Integration**: Support for SAP, Oracle, Tally, Zoho, and other ERP systems
- **Supply Chain Tracking**: Complete batch tracking from manufacturer to retailer

## Architecture
- **Backend**: NestJS with TypeScript
- **Database**: MongoDB with sharding
- **Caching**: Redis Enterprise
- **Message Queue**: Apache Kafka
- **Authentication**: Supabase Auth
- **Frontend**: React with TypeScript

## Supabase Authentication Integration
The system includes a complete Supabase authentication implementation:
- Sign up, login, logout, and token refresh endpoints
- JWT-based authentication with proper validation
- Role-based access control
- Secure session management

## Installation

### Prerequisites
- Node.js 16+
- MongoDB
- Redis
- Kafka (optional, for production)

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure your environment variables
4. Start the development server: `npm run start:dev`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh

### User Management
- `POST /api/users/signup` - Complete user registration
- `POST /api/users/login` - User login with profile data
- `GET /api/users/me` - Get current user profile
- `GET /api/users` - Get all users (admin/regulator only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin/regulator only)

### Health & Metrics
- `GET /api/health` - System health check
- `GET /api/health/detailed` - Detailed health status
- `GET /api/metrics` - Application metrics

## Configuration
The system uses environment variables for configuration. See the `.env` file for all configurable options.

## Contributing
Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

## License
This project is licensed under the MIT License.