-- E-Ledger Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    gln VARCHAR(13) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    position_label VARCHAR(255),
    erp_type VARCHAR(50),
    erp_status VARCHAR(20) DEFAULT 'PENDING',
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_gln ON users(gln);
CREATE INDEX IF NOT EXISTS idx_users_org_name ON users(org_name);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(255) UNIQUE NOT NULL,
    gtin VARCHAR(14) NOT NULL,
    lot_number VARCHAR(100) NOT NULL,
    blockchain_id VARCHAR(255) UNIQUE,
    genesis_hash VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit VARCHAR(50) NOT NULL,
    expiry_date DATE,
    manufacturer_gln VARCHAR(13) NOT NULL,
    current_owner_gln VARCHAR(13) NOT NULL,
    intended_recipient_gln VARCHAR(13),
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    sector VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    alcohol_content DECIMAL(5,2),
    category VARCHAR(100),
    dosage_form VARCHAR(100),
    serial_number VARCHAR(100),
    hsn_code VARCHAR(50),
    taxable_value DECIMAL(12,2),
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(12,2),
    duty_paid BOOLEAN DEFAULT FALSE,
    integrity_hash VARCHAR(64),
    total_returned_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (manufacturer_gln) REFERENCES users(gln),
    FOREIGN KEY (current_owner_gln) REFERENCES users(gln)
);

-- Indexes for batches
CREATE INDEX IF NOT EXISTS idx_batches_batch_id ON batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_gtin ON batches(gtin);
CREATE INDEX IF NOT EXISTS idx_batches_lot_number ON batches(lot_number);
CREATE INDEX IF NOT EXISTS idx_batches_current_owner ON batches(current_owner_gln);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);

-- Trace events table
CREATE TABLE IF NOT EXISTS trace_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    batch_id VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor_gln VARCHAR(13) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    tx_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64),
    metadata JSONB,
    return_reason VARCHAR(100),
    return_quantity INTEGER,
    return_recipient_gln VARCHAR(13),
    
    FOREIGN KEY (batch_id) REFERENCES batches(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_gln) REFERENCES users(gln)
);

-- Indexes for trace events
CREATE INDEX IF NOT EXISTS idx_trace_events_batch_id ON trace_events(batch_id);
CREATE INDEX IF NOT EXISTS idx_trace_events_actor_gln ON trace_events(actor_gln);
CREATE INDEX IF NOT EXISTS idx_trace_events_type ON trace_events(type);
CREATE INDEX IF NOT EXISTS idx_trace_events_timestamp ON trace_events(timestamp);

-- Blockchain blocks table
CREATE TABLE IF NOT EXISTS blockchain_blocks (
    id SERIAL PRIMARY KEY,
    index_no INTEGER UNIQUE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transactions JSONB NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) UNIQUE NOT NULL,
    merkle_root VARCHAR(64) NOT NULL,
    nonce INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for blockchain blocks
CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_index ON blockchain_blocks(index_no);
CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_hash ON blockchain_blocks(hash);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_gln VARCHAR(13),
    action VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    resource_type VARCHAR(50),
    details JSONB,
    
    FOREIGN KEY (user_gln) REFERENCES users(gln)
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_gln ON audit_logs(user_gln);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    req_id VARCHAR(255) UNIQUE NOT NULL,
    requester_gln VARCHAR(13) NOT NULL,
    responder_gln VARCHAR(13) NOT NULL,
    gtin VARCHAR(14) NOT NULL,
    serial_or_lot VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    response_message TEXT,
    
    FOREIGN KEY (requester_gln) REFERENCES users(gln),
    FOREIGN KEY (responder_gln) REFERENCES users(gln)
);

-- Indexes for verification requests
CREATE INDEX IF NOT EXISTS idx_verification_req_requester ON verification_requests(requester_gln);
CREATE INDEX IF NOT EXISTS idx_verification_req_responder ON verification_requests(responder_gln);
CREATE INDEX IF NOT EXISTS idx_verification_req_gtin ON verification_requests(gtin);

-- Logistics units table
CREATE TABLE IF NOT EXISTS logistics_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sscc VARCHAR(18) UNIQUE NOT NULL,
    creator_gln VARCHAR(13) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    contents TEXT[], -- Array of batch IDs
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tx_hash VARCHAR(64) NOT NULL,
    
    FOREIGN KEY (creator_gln) REFERENCES users(gln)
);

-- Indexes for logistics units
CREATE INDEX IF NOT EXISTS idx_logistics_units_sscc ON logistics_units(sscc);
CREATE INDEX IF NOT EXISTS idx_logistics_units_creator ON logistics_units(creator_gln);

-- Sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Index for sessions expiration
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user if not exists
INSERT INTO users (name, email, gln, role, org_name, country, sector, position_label, erp_type, password_hash, is_active, is_verified)
SELECT 'Admin User', 'admin@eledger.com', '0000000000000', 'ADMIN', 'E-Ledger Admin', 'GLOBAL', 'FMCG', 'System Administrator', 'MANUAL', '$2b$10$8K1p/aW4lKNKPuYsEY1pCOGeaFGfU1U/YVaXEJHM5qh8tqfwIHU3W', true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE gln = '0000000000000');