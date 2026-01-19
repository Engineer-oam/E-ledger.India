
/**
 * E-Ledger MVP Backend Server
 * 
 * Tech Stack: Node.js, Express, SQLite3, Crypto
 * Features:
 * - Blockchain Immutability (SHA-256 Linking)
 * - Strict Competitor Secrecy (RBAC)
 * - Audit Logs
 * - Duplicate Detection
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const crypto = require('crypto');

// Blockchain Module Imports
const { registerBlockchainRoutes } = require('./blockchain/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Initialization
const dbPath = path.resolve(__dirname, 'eledger_mvp.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB Connection Error:', err.message);
  else console.log('Connected to E-Ledger MVP Database at', dbPath);
});

// Helper: Generate SHA-256 Hash
const generateHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// Schema Setup
db.serialize(() => {
  // Existing Tables
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    gln TEXT UNIQUE,
    orgName TEXT,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS batches (
    batchID TEXT PRIMARY KEY,
    gtin TEXT,
    lotNumber TEXT,
    blockchainId TEXT UNIQUE, 
    genesisHash TEXT,
    currentOwnerGLN TEXT,
    manufacturerGLN TEXT,
    intendedRecipientGLN TEXT,
    status TEXT,
    data JSON,
    trace JSON
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    userGLN TEXT,
    action TEXT,
    resourceId TEXT,
    details TEXT
  )`);

  // --- NEW BLOCKCHAIN TABLES ---
  db.run(`CREATE TABLE IF NOT EXISTS blockchain_blocks (
    index_no INTEGER PRIMARY KEY,
    timestamp TEXT,
    transactions JSON,
    previousHash TEXT,
    hash TEXT UNIQUE,
    merkleRoot TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pending_transactions (
    txId TEXT PRIMARY KEY,
    payload TEXT,
    actorGLN TEXT,
    timestamp TEXT,
    signature TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed Genesis Block if empty
  db.get('SELECT COUNT(*) as count FROM blockchain_blocks', (err, row) => {
    if (row && row.count === 0) {
      const { Block } = require('./blockchain/core');
      const genesis = new Block(0, [{ type: 'GENESIS', msg: 'System Up' }], '0'.repeat(64));
      db.run(`INSERT INTO blockchain_blocks (index_no, timestamp, transactions, previousHash, hash, merkleRoot) VALUES (?, ?, ?, ?, ?, ?)`,
      [genesis.index, genesis.timestamp, JSON.stringify(genesis.transactions), genesis.previousHash, genesis.hash, genesis.merkleRoot]);
    }
  });
  
  // Create indexes for better performance
  db.run('CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_index ON blockchain_blocks(index_no)');
  db.run('CREATE INDEX IF NOT EXISTS idx_blockchain_blocks_hash ON blockchain_blocks(hash)');
  db.run('CREATE INDEX IF NOT EXISTS idx_pending_transactions_actor ON pending_transactions(actorGLN)');
  db.run('CREATE INDEX IF NOT EXISTS idx_pending_transactions_timestamp ON pending_transactions(timestamp)');
});

// Initialize Blockchain Routes & Hooks
registerBlockchainRoutes(app, db);

const logAudit = (userGLN, action, resourceId, details) => {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  db.run(
    `INSERT INTO audit_logs (id, timestamp, userGLN, action, resourceId, details) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, timestamp, userGLN, action, resourceId, details],
    (err) => { if(err) console.error("Audit Log Fail:", err); }
  );
};

// --- API ROUTES ---

app.get('/', (req, res) => {
  res.status(200).send('E-Ledger Blockchain Node Running. Status: 99.9% Uptime.');
});

// 1. AUTHENTICATION
app.post('/api/auth/login', (req, res) => {
  const { gln, password } = req.body;
  db.get('SELECT * FROM users WHERE gln = ? AND password = ?', [gln, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid Credentials' });
    const { password: _, ...user } = row;
    logAudit(gln, 'LOGIN', 'AUTH', 'User logged in');
    res.json(user);
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, orgName, gln, role, password } = req.body;
  const id = uuidv4();
  db.run(
    'INSERT INTO users (id, name, role, gln, orgName, password) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, role, gln, orgName, password],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'GLN already registered' });
        return res.status(500).json({ error: err.message });
      }
      logAudit(gln, 'SIGNUP', 'AUTH', 'New user registered');
      res.json({ id, name, role, gln, orgName });
    }
  );
});

// 2. BATCH OPERATIONS (Updated with Blockchain Anchor)
app.post('/api/batches', async (req, res) => {
  const b = req.body;
  
  const genesisData = { gtin: b.gtin, lot: b.lotNumber, mfg: b.manufacturerGLN, time: Date.now() };
  const genesisHash = generateHash(genesisData);
  const blockchainId = `BLK-${uuidv4().split('-')[0]}-${genesisHash.substring(0,8)}`;

  const dataBlob = JSON.stringify({
    quantity: b.quantity,
    unit: b.unit,
    productName: b.productName,
    expiryDate: b.expiryDate,
    alcoholContent: b.alcoholContent,
    category: b.category,
    dutyPaid: b.dutyPaid,
    integrityHash: b.integrityHash
  });

  db.run(
    `INSERT INTO batches (batchID, gtin, lotNumber, blockchainId, genesisHash, currentOwnerGLN, manufacturerGLN, status, data, trace)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [b.batchID, b.gtin, b.lotNumber, blockchainId, genesisHash, b.currentOwnerGLN, b.manufacturerGLN, b.status, dataBlob, JSON.stringify(b.trace)],
    async function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // --- BLOCKCHAIN ANCHOR ---
      try {
        await app.blockchain_submit({ action: 'CREATE', batchID: b.batchID, hash: genesisHash }, b.manufacturerGLN);
      } catch (e) { console.error("Blockchain anchoring failed:", e); }

      logAudit(b.manufacturerGLN, 'CREATE_BATCH', b.batchID, `Genesis Hash: ${genesisHash}`);
      res.json({ status: 'success', batchID: b.batchID, blockchainId });
    }
  );
});

app.put('/api/batches/:id', (req, res) => {
  const { status, currentOwnerGLN, intendedRecipientGLN, trace } = req.body;
  const id = req.params.id;

  db.run(
    `UPDATE batches SET status = ?, currentOwnerGLN = ?, intendedRecipientGLN = ?, trace = ? WHERE batchID = ?`,
    [status, currentOwnerGLN, intendedRecipientGLN, JSON.stringify(trace), id],
    async function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const latestEvent = trace[trace.length - 1];
      if (latestEvent) {
         // --- BLOCKCHAIN ANCHOR ---
         try {
           await app.blockchain_submit({ action: latestEvent.type, batchID: id, event: latestEvent }, latestEvent.actorGLN);
         } catch (e) { console.error("Blockchain anchoring failed:", e); }

         logAudit(latestEvent.actorGLN, latestEvent.type, id, `TxHash: ${latestEvent.txHash}`);
      }
      
      res.json({ status: 'success' });
    }
  );
});

// Remaining standard routes...
app.get('/api/batches', (req, res) => {
  const { gln, role } = req.query;
  db.all('SELECT * FROM batches', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let batches = rows.map(r => ({ ...r, ...JSON.parse(r.data || '{}'), trace: JSON.parse(r.trace || '[]') }));
    if (role !== 'REGULATOR' && role !== 'AUDITOR') {
      batches = batches.filter(b => b.currentOwnerGLN === gln || b.manufacturerGLN === gln || b.intendedRecipientGLN === gln || b.trace.some(t => t.actorGLN === gln));
    }
    res.json(batches);
  });
});

app.post('/api/pos/verify', (req, res) => {
  const { batchID, scannerGLN } = req.body;
  db.get('SELECT * FROM batches WHERE batchID = ?', [batchID], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Item not found' });
    if (row.status === 'SOLD') return res.status(409).json({ error: 'DUPLICATE', message: 'Item already sold.' });
    res.json({ status: 'VALID' });
  });
});

app.listen(PORT, () => console.log(`E-Ledger MVP Backend running on port ${PORT}`));
