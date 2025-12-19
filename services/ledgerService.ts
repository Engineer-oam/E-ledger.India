import { Batch, BatchStatus, TraceEvent, User, UserRole, LogisticsUnit, VerificationRequest, VerificationStatus, PaymentDetails, GSTDetails, EWayBill, ReturnReason, Sector, ERPType } from '../types';

const LEDGER_STORAGE_KEY = 'eledger_data';
const SSCC_STORAGE_KEY = 'eledger_sscc';
const DELAY_MS = 400;

// AWS/Environment Check
const getApiUrl = () => {
  // If deployed on AWS with API Gateway, this would be the endpoint
  return localStorage.getItem('ELEDGER_API_URL') || process.env.API_GATEWAY_URL || '/api';
};

const isRemote = () => {
  return localStorage.getItem('ELEDGER_USE_REMOTE') === 'true';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sha256 = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getLedgerState = (): Batch[] => {
  try {
    const stored = localStorage.getItem(LEDGER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveLedgerState = (batches: Batch[]) => {
  localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(batches));
};

export const LedgerService = {
  getBatches: async (user: User): Promise<Batch[]> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${getApiUrl()}/batches?gln=${user.gln}&role=${user.role}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("Remote fetch failed, falling back to local simulation.");
      }
    }
    
    await delay(DELAY_MS);
    const ledgerState = getLedgerState();
    
    if (user.role === UserRole.REGULATOR || user.role === UserRole.AUDITOR) {
      return ledgerState;
    }
    
    return ledgerState.filter(b => 
      b.currentOwnerGLN === user.gln || 
      b.manufacturerGLN === user.gln ||
      b.intendedRecipientGLN === user.gln ||
      b.trace.some(t => t.actorGLN === user.gln)
    );
  },

  exportLedger: async (): Promise<Batch[]> => {
    if (isRemote()) {
       try {
         const res = await fetch(`${getApiUrl()}/batches?role=AUDITOR`); 
         if (res.ok) return await res.json();
       } catch (e) { /* fallback */ }
    }
    return getLedgerState();
  },

  getBatchByID: async (batchID: string): Promise<Batch | undefined> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${getApiUrl()}/batches/${batchID}`);
        if (res.ok) return await res.json();
      } catch(e) {}
    }
    const ledgerState = getLedgerState();
    return ledgerState.find(b => b.batchID === batchID);
  },

  verifyByHash: async (hash: string): Promise<Batch | undefined> => {
    const ledgerState = getLedgerState();
    return ledgerState.find(b => b.integrityHash === hash || b.blockchainId === hash);
  },

  createBatch: async (batchData: Partial<Batch>, actor: User): Promise<string> => {
    const timestamp = new Date().toISOString();
    const identityString = `${batchData.gtin}-${batchData.lotNumber}-${actor.gln}-${timestamp}`;
    const genesisHash = await sha256(identityString);
    const batchID = `BATCH-${Date.now()}`;
    const blockchainId = `BLK-${genesisHash.substring(0,12)}`;

    const newBatch: Batch = {
      batchID,
      blockchainId,
      genesisHash,
      gtin: batchData.gtin!,
      lotNumber: batchData.lotNumber!,
      expiryDate: batchData.expiryDate!,
      quantity: batchData.quantity || 0,
      unit: batchData.unit || 'units',
      productName: batchData.productName || 'Unknown Product',
      manufacturerGLN: actor.gln,
      currentOwnerGLN: actor.gln,
      status: batchData.status || BatchStatus.BONDED,
      integrityHash: genesisHash,
      sector: actor.sector,
      country: actor.country,
      alcoholContent: batchData.alcoholContent,
      category: batchData.category,
      dutyPaid: batchData.dutyPaid || false,
      hsnCode: batchData.hsnCode,
      taxableValue: batchData.taxableValue,
      taxRate: batchData.taxRate,
      taxAmount: batchData.taxAmount,
      totalReturnedQuantity: 0,
      trace: [
        {
          eventID: `evt-${Date.now()}`,
          type: 'MANUFACTURE',
          timestamp: timestamp,
          actorGLN: actor.gln,
          actorName: actor.orgName,
          location: 'Manufacturing Plant',
          txHash: await sha256(`GENESIS:${genesisHash}`),
          previousHash: '00000000000000000000000000000000',
          metadata: { 
            note: 'Genesis Creation', 
            integrityHash: genesisHash
          }
        }
      ]
    };
    
    // Anchor to simulated local blockchain
    const { BlockchainAPI } = await import('../blockchain/api');
    await BlockchainAPI.submit({ action: 'CREATE_BATCH', batchID: newBatch.batchID }, actor.gln);

    if (isRemote()) {
      try {
        await fetch(`${getApiUrl()}/batches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBatch)
        });
      } catch (e) { /* use local */ }
    }
    
    const ledgerState = getLedgerState();
    saveLedgerState([newBatch, ...ledgerState]);
    
    return newBatch.batchID;
  },

  updateBatch: async (batch: Batch, newEvent: TraceEvent) => {
    const lastEvent = batch.trace[batch.trace.length - 1];
    newEvent.previousHash = lastEvent.txHash;
    newEvent.txHash = await sha256(JSON.stringify(newEvent) + lastEvent.txHash);

    const updatedBatch = {
        ...batch,
        trace: [...batch.trace, newEvent]
    };

    if (newEvent.type === 'RETURN' && newEvent.returnQuantity) {
        updatedBatch.totalReturnedQuantity = (updatedBatch.totalReturnedQuantity || 0) + newEvent.returnQuantity;
    }

    const { BlockchainAPI } = await import('../blockchain/api');
    await BlockchainAPI.submit({ action: newEvent.type, batchID: updatedBatch.batchID, txHash: newEvent.txHash }, newEvent.actorGLN);

    if (isRemote()) {
      try {
        await fetch(`${getApiUrl()}/batches/${batch.batchID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBatch)
        });
      } catch (e) {}
    }
    
    const ledgerState = getLedgerState();
    const index = ledgerState.findIndex(b => b.batchID === batch.batchID);
    if (index !== -1) {
      ledgerState[index] = updatedBatch;
      saveLedgerState(ledgerState);
    }
    
    return updatedBatch;
  },

  checkPOSStatus: async (batchID: string, gln: string): Promise<{status: 'VALID' | 'INVALID' | 'DUPLICATE', message: string}> => {
      const batch = await LedgerService.getBatchByID(batchID);
      if(!batch) return { status: 'INVALID', message: 'Identifier not found in E-Ledger Network.' };
      if(batch.status === BatchStatus.SOLD) return { status: 'DUPLICATE', message: 'Anti-Counterfeit Alert: This specific item was already dispensed/sold.' };
      if(batch.status === BatchStatus.QUARANTINED || batch.status === BatchStatus.RECALLED) return { status: 'INVALID', message: 'Compliance Block: This batch is under active recall.' };
      
      return { status: 'VALID', message: 'Identity Verified.' };
  },

  transferBatches: async (
    batchIDs: string[], 
    toGLN: string, 
    toName: string, 
    actor: User,
    gst?: GSTDetails,
    ewbPartial?: Partial<EWayBill>,
    paymentMeta?: any
  ): Promise<boolean> => {
    await delay(DELAY_MS); 
    const currentBatches = await LedgerService.getBatches(actor); 
    
    for (const id of batchIDs) {
        const batch = currentBatches.find(b => b.batchID === id);
        if (!batch || batch.currentOwnerGLN !== actor.gln) continue;

        const newEvent: TraceEvent = {
            eventID: `evt-${Date.now()}`,
            type: 'DISPATCH',
            timestamp: new Date().toISOString(),
            actorGLN: actor.gln,
            actorName: actor.orgName,
            location: ewbPartial?.fromPlace || 'Shipping Hub',
            txHash: '',
            previousHash: '',
            metadata: { 
              recipient: toName, 
              recipientGLN: toGLN, 
              gst, 
              ewayBill: ewbPartial,
              payment: paymentMeta
            }
        };

        const updated = { ...batch, status: BatchStatus.IN_TRANSIT, intendedRecipientGLN: toGLN };
        await LedgerService.updateBatch(updated, newEvent);
    }
    return true;
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
      location: 'Inbound Dock',
      txHash: '',
      previousHash: '',
      metadata: { method: 'System Sync', sourceGLN: batch.currentOwnerGLN }
    };

    const updated = { ...batch, currentOwnerGLN: actor.gln, intendedRecipientGLN: undefined, status: BatchStatus.RECEIVED };
    return await LedgerService.updateBatch(updated, receiveEvent);
  },

  sellBatch: async (batchID: string, actor: User): Promise<Batch> => {
    const check = await LedgerService.checkPOSStatus(batchID, actor.gln);
    if(check.status !== 'VALID') throw new Error(check.message);

    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const saleEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'SALE',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Point of Sale',
      txHash: '', 
      previousHash: '',
      metadata: { 
        type: 'Consumer Transaction',
        taxableValue: batch.taxableValue,
        taxAmount: batch.taxAmount,
      }
    };

    const updated = { ...batch, status: BatchStatus.SOLD };
    return await LedgerService.updateBatch(updated, saleEvent);
  },

  recallBatch: async (batchID: string, reason: string, actor: User): Promise<boolean> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const recallEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'RECALL',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Quality Control',
      txHash: '',
      previousHash: '',
      metadata: { reason: reason, initiator: actor.name }
    };

    const updated = { ...batch, status: BatchStatus.RECALLED };
    await LedgerService.updateBatch(updated, recallEvent);
    return true;
  },
  
  returnBatch: async (batchID: string, toGLN: string, reason: ReturnReason, quantity: number, actor: User, refundValue?: number): Promise<boolean> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");
    
    const available = batch.quantity - (batch.totalReturnedQuantity || 0);
    if (quantity > available) throw new Error(`Insufficient quantity. Max return: ${available}`);

    const event: TraceEvent = {
        eventID: `evt-${Date.now()}`,
        type: 'RETURN',
        timestamp: new Date().toISOString(),
        actorGLN: actor.gln,
        actorName: actor.orgName,
        location: 'Return Processing',
        txHash: '', 
        previousHash: '',
        returnReason: reason,
        returnQuantity: quantity,
        returnRecipientGLN: toGLN,
        metadata: { refund: refundValue, returnTo: toGLN }
    };
    
    const updated = { ...batch, status: BatchStatus.IN_TRANSIT, intendedRecipientGLN: toGLN };
    await LedgerService.updateBatch(updated, event);
    return true;
  },

  getLogisticsUnits: async (user: User): Promise<LogisticsUnit[]> => {
    try {
        const stored = localStorage.getItem(SSCC_STORAGE_KEY);
        const units: LogisticsUnit[] = stored ? JSON.parse(stored) : [];
        return units.filter(u => u.creatorGLN === user.gln);
    } catch { return []; }
  },

  createLogisticsUnit: async (sscc: string, batchIDs: string[], actor: User): Promise<string> => {
    const newUnit: LogisticsUnit = {
      sscc,
      creatorGLN: actor.gln,
      status: 'CREATED',
      contents: batchIDs,
      createdDate: new Date().toISOString(),
      txHash: await sha256(sscc + actor.gln)
    };
    const stored = localStorage.getItem(SSCC_STORAGE_KEY);
    const units = stored ? JSON.parse(stored) : [];
    localStorage.setItem(SSCC_STORAGE_KEY, JSON.stringify([newUnit, ...units]));
    return sscc;
  },
  
  submitVerificationRequest: async (gtin: string, lot: string, requester: User): Promise<VerificationRequest> => {
     return { 
       reqID: `VRS-${Date.now()}`, 
       requesterGLN: requester.gln, 
       responderGLN: 'SYSTEM-NODE', 
       gtin, 
       serialOrLot: lot, 
       timestamp: new Date().toISOString(), 
       status: VerificationStatus.VERIFIED, 
       responseMessage: 'Saleable Product Authenticity Confirmed.' 
     };
  },
  
  getVerificationHistory: async (user: User) => []
};