import { Batch, BatchStatus, UserRole, User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'user-mfg-01',
    name: 'Alice Manufacturing',
    role: UserRole.MANUFACTURER,
    gln: '0490001234567',
    orgName: 'Apex Pharma Ltd.'
  },
  {
    id: 'user-dist-01',
    name: 'Bob Logistics',
    role: UserRole.DISTRIBUTOR,
    gln: '0490001234568',
    orgName: 'Global Distro Corp'
  },
  {
    id: 'user-ret-01',
    name: 'Charlie Retail',
    role: UserRole.RETAILER,
    gln: '0490001234569',
    orgName: 'MediCare Pharmacy'
  },
  {
    id: 'user-reg-01',
    name: 'Inspector Gadget',
    role: UserRole.REGULATOR,
    gln: '0490001234599',
    orgName: 'Govt Health Authority'
  }
];

// Seed Data simulating Ledger State
export const INITIAL_BATCHES: Batch[] = [
  {
    batchID: 'BATCH-20241001-A',
    gtin: '00089012345678',
    lotNumber: 'LOT-A100',
    expiryDate: '2026-10-01',
    quantity: 5000,
    unit: 'vials',
    manufacturerGLN: '0490001234567',
    currentOwnerGLN: '0490001234568', // Currently with Distributor
    status: BatchStatus.IN_TRANSIT,
    productName: 'Vaccine-X19',
    trace: [
      {
        eventID: 'evt-001',
        type: 'MANUFACTURE',
        timestamp: '2024-10-01T08:00:00Z',
        actorGLN: '0490001234567',
        actorName: 'Apex Pharma Ltd.',
        location: 'Mumbai Plant A',
        txHash: '0x123abc...789',
        metadata: { temperature: '4.0C' }
      },
      {
        eventID: 'evt-002',
        type: 'DISPATCH',
        timestamp: '2024-10-02T14:30:00Z',
        actorGLN: '0490001234567',
        actorName: 'Apex Pharma Ltd.',
        location: 'Mumbai Warehouse',
        txHash: '0x456def...012'
      },
      {
        eventID: 'evt-003',
        type: 'RECEIVE',
        timestamp: '2024-10-03T09:15:00Z',
        actorGLN: '0490001234568',
        actorName: 'Global Distro Corp',
        location: 'Delhi Hub',
        txHash: '0x789ghi...345'
      }
    ]
  },
  {
    batchID: 'BATCH-20241005-B',
    gtin: '00089098765432',
    lotNumber: 'LOT-B200',
    expiryDate: '2025-05-20',
    quantity: 1000,
    unit: 'boxes',
    manufacturerGLN: '0490001234567',
    currentOwnerGLN: '0490001234567',
    status: BatchStatus.CREATED,
    productName: 'PainRelief Ultra',
    trace: [
      {
        eventID: 'evt-004',
        type: 'MANUFACTURE',
        timestamp: '2024-10-05T10:00:00Z',
        actorGLN: '0490001234567',
        actorName: 'Apex Pharma Ltd.',
        location: 'Mumbai Plant B',
        txHash: '0xabc123...xyz'
      }
    ]
  },
  {
    batchID: 'BATCH-20240901-C',
    gtin: '00089011223344',
    lotNumber: 'LOT-C99',
    expiryDate: '2024-12-01',
    quantity: 200,
    unit: 'units',
    manufacturerGLN: '0490001234567',
    currentOwnerGLN: '0490001234569', // Retailer
    status: BatchStatus.RECEIVED,
    productName: 'CoughSyrup Kids',
    trace: [
      {
        eventID: 'evt-010',
        type: 'MANUFACTURE',
        timestamp: '2024-09-01T08:00:00Z',
        actorGLN: '0490001234567',
        actorName: 'Apex Pharma Ltd.',
        location: 'Pune Plant',
        txHash: '0xAAA...'
      },
      {
        eventID: 'evt-011',
        type: 'DISPATCH',
        timestamp: '2024-09-05T10:00:00Z',
        actorGLN: '0490001234567',
        actorName: 'Apex Pharma Ltd.',
        location: 'Pune Warehouse',
        txHash: '0xBBB...'
      },
      {
        eventID: 'evt-012',
        type: 'RECEIVE',
        timestamp: '2024-09-06T12:00:00Z',
        actorGLN: '0490001234569',
        actorName: 'MediCare Pharmacy',
        location: 'Bangalore Store',
        txHash: '0xCCC...'
      }
    ]
  }
];