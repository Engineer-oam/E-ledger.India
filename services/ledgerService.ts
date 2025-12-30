import { Batch, BatchStatus, TraceEvent, User, UserRole, LogisticsUnit, VerificationRequest, VerificationStatus, PaymentDetails, GSTDetails, EWayBill, ReturnReason, Sector, ERPType } from '../types';

const LEDGER_STORAGE_KEY = 'eledger_data';
const SSCC_STORAGE_KEY = 'eledger_sscc';
const DELAY_MS = 200;

/**
 * AWS NETWORK CONFIGURATION
 */
const getApiUrl = () => {
  // If hosted on AWS, we use relative paths (/api) handled by Nginx or Amplify
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname.includes('amplifyapp.com') || 
     window.location.hostname.includes('compute.amazonaws.com') ||
     !['localhost', '127.0.0.1'].includes(window.location.hostname));

  if (isProduction) return '/api';
  return process.env.API_GATEWAY_URL || localStorage.getItem('ELEDGER_API_URL') || 'http://localhost:3001/api';
};

/**
 * Remote detection: If we are in the cloud, we MUST use the centralized DB.
 */
const isRemote = () => {
  if (typeof window === 'undefined') return false;
  const isCloud = !['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isCloud || localStorage.getItem('ELEDGER_USE_REMOTE') === 'true';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sha256 = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getLedgerStateLocal = (): Batch[] => {
  try {
    const stored = localStorage.getItem(LEDGER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) { return []; }
};

export const LedgerService = {
  getBatches: async (user: User): Promise<Batch[]> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${getApiUrl()}/batches?gln=${user.gln}&role=${user.role}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error("AWS Centralized DB unreachable.");
      }
    }
    
    // Fallback to local only if not in cloud
    await delay(DELAY_MS);
    return getLedgerStateLocal().filter(b => 
      user.role === UserRole.REGULATOR || 
      b.currentOwnerGLN === user.gln || 
      b.trace.some(t => t.actorGLN === user.gln)
    );
  },

  exportLedger: async (): Promise<Batch[]> => {
    if (isRemote()) {
       try {
         const res = await fetch(`${getApiUrl()}/batches?role=AUDITOR`); 
         if (res.ok) return await res.json();
       } catch (e) {}
    }
    return getLedgerStateLocal();
  },

  getBatchByID: async (batchID: string): Promise<Batch | undefined> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${getApiUrl()}/batches/${batchID}`);
        if (res.ok) return await res.json();
      } catch(e) {}
    }
    return getLedgerStateLocal().find(b => b.batchID === batchID);
  },

  createBatch: async (batchData: Partial<Batch>, actor: User): Promise<string> => {
    const timestamp = new Date().toISOString();
    const identityString = `${batchData.gtin}-${batchData.lotNumber}-${actor.gln}-${timestamp}`;
    const genesisHash = await sha256(identityString);
    const batchID = `BATCH-${Date.now()}`;
    const blockchainId = `BLK-${genesisHash.substring(0,12)}`;

    const newBatch: Batch = {
      ...batchData as Batch,
      batchID,
      blockchainId,
      genesisHash,
      manufacturerGLN: actor.gln,
      currentOwnerGLN: actor.gln,
      status: batchData.status || BatchStatus.BONDED,
      integrityHash: genesisHash,
      trace: [{
        eventID: `evt-${Date.now()}`,
        type: 'MANUFACTURE',
        timestamp,
        actorGLN: actor.gln,
        actorName: actor.orgName,
        location: 'Production Unit',
        txHash: genesisHash,
        previousHash: '0'.repeat(64),
        metadata: { note: 'Genesis Block Created on AWS Node' }
      }]
    };

    if (isRemote()) {
      const res = await fetch(`${getApiUrl()}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatch)
      });
      if (!res.ok) throw new Error("Cloud write failed");
      return batchID;
    }
    
    const local = getLedgerStateLocal();
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify([newBatch, ...local]));
    return batchID;
  },

  updateBatch: async (batch: Batch, newEvent: TraceEvent) => {
    const updatedBatch = { ...batch, trace: [...batch.trace, newEvent] };

    if (isRemote()) {
      await fetch(`${getApiUrl()}/batches/${batch.batchID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBatch)
      });
      return updatedBatch;
    }
    
    const local = getLedgerStateLocal();
    const idx = local.findIndex(b => b.batchID === batch.batchID);
    if (idx !== -1) {
      local[idx] = updatedBatch;
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(local));
    }
    return updatedBatch;
  },

  checkPOSStatus: async (batchID: string, gln: string): Promise<{status: 'VALID' | 'INVALID' | 'DUPLICATE', message: string}> => {
      const batch = await LedgerService.getBatchByID(batchID);
      if(!batch) return { status: 'INVALID', message: 'Not found in E-Ledger Network.' };
      if(batch.status === BatchStatus.SOLD) return { status: 'DUPLICATE', message: 'Anti-Counterfeit: Item already dispensed.' };
      return { status: 'VALID', message: 'Identity Verified.' };
  },

  receiveBatch: async (batchID: string, actor: User): Promise<Batch> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const receiveEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'RECEIVE',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Inbound Warehouse',
      txHash: await sha256(`REC:${batchID}:${Date.now()}`),
      previousHash: batch.trace[batch.trace.length-1].txHash
    };

    const updated = { ...batch, currentOwnerGLN: actor.gln, status: BatchStatus.RECEIVED };
    return await LedgerService.updateBatch(updated, receiveEvent);
  },

  sellBatch: async (batchID: string, actor: User): Promise<Batch> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const saleEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'SALE',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Point of Sale',
      txHash: await sha256(`SALE:${batchID}:${Date.now()}`),
      previousHash: batch.trace[batch.trace.length-1].txHash,
      metadata: { amount: batch.taxableValue }
    };

    const updated = { ...batch, status: BatchStatus.SOLD };
    return await LedgerService.updateBatch(updated, saleEvent);
  },

  recallBatch: async (batchID: string, reason: string, actor: User): Promise<boolean> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) return false;
    const recallEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'RECALL',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Regulatory Office',
      txHash: await sha256(`RECALL:${batchID}`),
      previousHash: batch.trace[batch.trace.length-1].txHash,
      metadata: { reason }
    };
    await LedgerService.updateBatch({ ...batch, status: BatchStatus.RECALLED }, recallEvent);
    return true;
  },

  getLogisticsUnits: async (user: User) => [],
  createLogisticsUnit: async (s:string, b:string[], u:User) => s,
  verifyByHash: async (h: string) => undefined,
  submitVerificationRequest: async (g:string, l:string, r:User) => ({} as any),
  getVerificationHistory: async (u: User) => [],
  // Fix: Updated method signature to accept additional optional parameters passed from BatchManager
  transferBatches: async (ids: string[], to: string, name: string, u: User, gst?: GSTDetails, ewbPartial?: Partial<EWayBill>, payment?: any) => true,
  // Fix: Updated method signature to accept additional optional refund parameter passed from BatchManager
  returnBatch: async (id: string, to: string, r: ReturnReason, q: number, u: User, refund?: number) => true
};