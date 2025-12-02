

export enum UserRole {
  MANUFACTURER = 'MANUFACTURER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  RETAILER = 'RETAILER',
  REGULATOR = 'REGULATOR',
  AUDITOR = 'AUDITOR'
}

export enum BatchStatus {
  CREATED = 'CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  SOLD = 'SOLD',
  RECALLED = 'RECALLED',
  DESTROYED = 'DESTROYED',
  RETURNED = 'RETURNED',
  QUARANTINED = 'QUARANTINED'
}

export interface TraceEvent {
  eventID: string;
  type: 'MANUFACTURE' | 'DISPATCH' | 'RECEIVE' | 'SALE' | 'AGGREGATION' | 'TRANSFORMATION' | 'RETURN' | 'RETURN_RECEIPT' | 'SHIPMENT_RECEIPT';
  timestamp: string;
  actorGLN: string;
  actorName: string;
  location: string;
  metadata?: Record<string, any>;
  txHash: string; // Simulated Blockchain Transaction Hash
}

export interface Batch {
  batchID: string;
  gtin: string; // 14-digit Global Trade Item Number
  lotNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  manufacturerGLN: string;
  currentOwnerGLN: string;
  intendedRecipientGLN?: string; // Privacy: Only this GLN can receive it
  status: BatchStatus;
  trace: TraceEvent[];
  productName: string;
  integrityHash?: string; // Digital Twin Unique ID
}

export interface LogisticsUnit {
  sscc: string; // 18-digit Serial Shipping Container Code
  creatorGLN: string;
  status: 'CREATED' | 'SHIPPED' | 'RECEIVED';
  contents: string[]; // Array of Batch IDs contained in this pallet
  createdDate: string;
  txHash: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  gln: string; // Global Location Number
  orgName: string;
}

export interface DashboardMetrics {
  totalBatches: number;
  activeShipments: number;
  alerts: number;
  complianceScore: number;
}

// --- NEW FOR MEDILEDGER PARITY ---

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  SUSPECT = 'SUSPECT' // DSCSA term for potential counterfeit
}

export interface VerificationRequest {
  reqID: string;
  requesterGLN: string;
  responderGLN: string; // Manufacturer
  gtin: string;
  serialOrLot: string;
  timestamp: string;
  status: VerificationStatus;
  responseMessage?: string;
}

// --- SUPPLY CHAIN FINANCE ---
export enum PaymentStatus {
  PAID = 'PAID',
  CREDIT = 'CREDIT',
  PENDING = 'PENDING',
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  WAIVED = 'WAIVED'
}

export interface PaymentDetails {
  status: PaymentStatus;
  method: 'CASH' | 'CARD' | 'INSURANCE' | 'INVOICE';
  amount: number;
  currency: string;
  timestamp: string;
}

export interface GSTDetails {
  hsnCode: string;
  taxableValue: number;
  taxRate: number; 
  taxAmount: number;
  invoiceNo: string;
  invoiceDate: string;
}

export interface EWayBill {
  ewbNo: string;
  vehicleNo: string;
  fromPlace: string;
  toPlace: string;
  distanceKm: number;
  validUntil: string;
  generatedDate: string;
}

export enum ReturnReason {
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  UNSOLD = 'UNSOLD',
  RECALLED = 'RECALLED',
  INCORRECT_ITEM = 'INCORRECT_ITEM'
}