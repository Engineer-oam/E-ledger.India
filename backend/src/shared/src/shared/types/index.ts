// Core entity types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// GLN (Global Location Number) related types
export interface GLNInfo extends BaseEntity {
  gln: string;
  companyName: string;
  address: string;
  country: string;
  entityType: 'MANUFACTURER' | 'DISTRIBUTOR' | 'RETAILER' | 'REGULATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  licenseInfo?: LicenseInfo;
}

export interface LicenseInfo {
  licenseNumber: string;
  issuingAuthority: string;
  validFrom: Date;
  validTo: Date;
  licenseType: string;
}

// Transaction types
export interface Transaction extends BaseEntity {
  transactionId: string;
  type: 'CREATE_BATCH' | 'TRANSFER' | 'VERIFY' | 'DISPOSE';
  payload: any;
  actorGLN: string;
  signature: string;
  timestamp: Date;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  blockchainHash?: string;
}

// Batch types for pharmaceutical supply chain
export interface Batch extends BaseEntity {
  batchId: string;
  gtin: string;
  lotNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  expiryDate: Date;
  manufacturerGLN: string;
  currentOwnerGLN: string;
  intendedRecipientGLN?: string;
  status: 'MANUFACTURED' | 'IN_TRANSIT' | 'RECEIVED' | 'SOLD' | 'DISPOSED';
  trace: TraceEvent[];
  blockchainId: string;
  genesisHash: string;
}

export interface TraceEvent {
  type: 'CREATE' | 'TRANSFER' | 'VERIFY' | 'DISPOSE';
  actorGLN: string;
  timestamp: Date;
  location?: string;
  notes?: string;
  txHash: string;
}

// Consortium node types
export interface ConsortiumNode {
  nodeId: string;
  host: string;
  port: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  shardId: string;
  load: number; // 0-100 percentage
  lastHeartbeat: Date;
}

// Sharding types
export interface Shard {
  shardId: string;
  nodes: ConsortiumNode[];
  hashRange: {
    start: string;
    end: string;
  };
  currentLoad: number;
  maxCapacity: number;
}

// Cross-border verification types
export interface GLNVerificationRequest {
  gln: string;
  countryCode: string;
  requestingEntityGLN: string;
  verificationType: 'FULL' | 'BASIC';
}

export interface GLNVerificationResponse {
  gln: string;
  isValid: boolean;
  companyName?: string;
  country?: string;
  entityType?: string;
  verificationTimestamp: Date;
  registrySource?: string;
  complianceStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
}

// Performance metrics
export interface PerformanceMetrics {
  tps: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  uptime: number;
  shardDistribution: Record<string, number>;
}

// Compliance types
export interface ComplianceCheck {
  transactionId: string;
  batchId: string;
  actorGLN: string;
  countryCode: string;
  regulations: string[];
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING_REVIEW';
  violations?: string[];
  checkedAt: Date;
}