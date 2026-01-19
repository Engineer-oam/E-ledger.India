
const { hash, sign } = require('./crypto');
const { Block, BlockchainEngine } = require('./core');

const registerBlockchainRoutes = (app, db) => {
  
  // 1. GET ALL BLOCKS (Explorer)
  app.get('/api/blockchain/blocks', (req, res) => {
    db.all('SELECT * FROM blockchain_blocks ORDER BY index_no DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const blocks = rows.map(r => ({
        ...r,
        transactions: JSON.parse(r.transactions || '[]')
      }));
      res.json(blocks);
    });
  });

  // 3. GET BLOCK BY INDEX
  app.get('/api/blockchain/block/:index', (req, res) => {
    const index = parseInt(req.params.index);
    if (isNaN(index)) {
      return res.status(400).json({ error: 'Invalid block index' });
    }
    
    db.get('SELECT * FROM blockchain_blocks WHERE index_no = ?', [index], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Block not found' });
      
      res.json({
        ...row,
        transactions: JSON.parse(row.transactions || '[]')
      });
    });
  });
  
  // 4. GET TRANSACTION BY ID
  app.get('/api/blockchain/transaction/:txId', (req, res) => {
    const txId = req.params.txId;
    
    db.all('SELECT * FROM blockchain_blocks', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      for (const row of rows) {
        const transactions = JSON.parse(row.transactions || '[]');
        const transaction = transactions.find(tx => tx.txId === txId);
        if (transaction) {
          return res.json({
            ...transaction,
            blockIndex: row.index_no,
            blockHash: row.hash
          });
        }
      }
      
      res.status(404).json({ error: 'Transaction not found' });
    });
  });
  
  // 5. SUBMIT TRANSACTION TO PENDING POOL
  app.post('/api/blockchain/transaction', async (req, res) => {
    const { payload, actorGLN } = req.body;
    
    if (!payload || !actorGLN) {
      return res.status(400).json({ error: 'Missing payload or actorGLN' });
    }
    
    // Create Transaction Envelope
    const envelope = {
      payload,
      actor: actorGLN,
      timestamp: new Date().toISOString(),
      txId: hash(JSON.stringify(payload) + Date.now() + Math.random()),
      signature: sign(payload, actorGLN) // Cryptographic seal
    };
    
    // Validate the transaction
    try {
      const validation = await BlockchainEngine.validateTransaction(envelope, db);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    } catch (err) {
      console.error('Transaction validation error:', err);
      return res.status(500).json({ error: 'Transaction validation failed' });
    }
    
    // Add to pending transactions table
    db.run(
      `INSERT INTO pending_transactions (txId, payload, actorGLN, timestamp, signature)
       VALUES (?, ?, ?, ?, ?)`,
      [envelope.txId, JSON.stringify(envelope.payload), envelope.actor, envelope.timestamp, envelope.signature],
      (err) => {
        if (err) {
          console.error('Error adding transaction to pending pool:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, txId: envelope.txId });
      }
    );
  });
  
  // 6. MINE PENDING TRANSACTIONS
  app.post('/api/blockchain/mine', async (req, res) => {
    // Get all pending transactions
    db.all('SELECT * FROM pending_transactions ORDER BY timestamp ASC', [], async (err, pendingRows) => {
      if (err) {
        console.error('Error fetching pending transactions:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (pendingRows.length === 0) {
        return res.json({ message: 'No pending transactions to mine' });
      }
      
      // Parse transactions and validate each one
      const validTransactions = [];
      for (const row of pendingRows) {
        const transaction = {
          payload: JSON.parse(row.payload),
          actor: row.actorGLN,
          timestamp: row.timestamp,
          txId: row.txId,
          signature: row.signature
        };
        
        // Validate each transaction
        try {
          const validation = await BlockchainEngine.validateTransaction(transaction, db);
          if (validation.valid) {
            validTransactions.push(transaction);
          } else {
            console.warn('Invalid transaction rejected from mining:', transaction.txId, validation.error);
          }
        } catch (err) {
          console.error('Error validating transaction:', err);
        }
      }
      
      if (validTransactions.length === 0) {
        return res.json({ message: 'No valid transactions to mine after validation' });
      }
      
      // Get last block to link
      db.get('SELECT * FROM blockchain_blocks ORDER BY index_no DESC LIMIT 1', [], (err, lastBlock) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const index = lastBlock ? lastBlock.index_no + 1 : 0;
        const prevHash = lastBlock ? lastBlock.hash : '0'.repeat(64);
        
        const newBlock = new Block(index, validTransactions, prevHash);
        
        // Insert the new block
        db.run(
          `INSERT INTO blockchain_blocks (index_no, timestamp, transactions, previousHash, hash, merkleRoot)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newBlock.index, newBlock.timestamp, JSON.stringify(newBlock.transactions), newBlock.previousHash, newBlock.hash, newBlock.merkleRoot],
          (err) => {
            if (err) {
              console.error('Error inserting new block:', err);
              return res.status(500).json({ error: err.message });
            }
            
            // Clear mined transactions
            db.run('DELETE FROM pending_transactions', (err) => {
              if (err) {
                console.error('Error clearing pending transactions:', err);
                // Continue anyway since block was created
              }
              
              res.json({
                success: true,
                blockIndex: newBlock.index,
                blockHash: newBlock.hash,
                transactionsMined: validTransactions.length
              });
            });
          }
        );
      });
    });
  });
  
  // 7. VALIDATE ENTIRE BLOCKCHAIN
  app.get('/api/blockchain/validate', (req, res) => {
    db.all('SELECT * FROM blockchain_blocks ORDER BY index_no ASC', [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (rows.length === 0) {
        return res.json({ valid: true, height: 0 });
      }
      
      // Validate chain integrity
      for (let i = 1; i < rows.length; i++) {
        const current = rows[i];
        const previous = rows[i - 1];
        
        // Check if linked properly
        if (current.previousHash !== previous.hash) {
          return res.json({ 
            valid: false, 
            errorIndex: i, 
            error: `Block ${i} not properly linked to block ${i-1}`
          });
        }
        
        // Recalculate hash to verify integrity
        const calculatedHash = hash(
          current.index_no + 
          current.previousHash + 
          current.timestamp + 
          current.merkleRoot + 
          0 // nonce is not stored in DB but assuming 0 for verification
        );
        
        if (calculatedHash !== current.hash) {
          return res.json({ 
            valid: false, 
            errorIndex: i, 
            error: `Block ${i} has invalid hash`
          });
        }
      }
      
      res.json({ valid: true, height: rows.length });
    });
  });
  
  // 8. GET BLOCKCHAIN LENGTH
  app.get('/api/blockchain/length', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM blockchain_blocks', [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ length: row.count || 0 });
    });
  });
  
  // 9. INTERNAL HELPER: APPEND TRANSACTION
  // This is called by the main server handlers
  app.blockchain_submit = async (txData, actorGLN) => {
    return new Promise(async (resolve, reject) => {
      // Create Transaction Envelope
      const envelope = {
        payload: txData,
        actor: actorGLN,
        timestamp: new Date().toISOString(),
        txId: hash(JSON.stringify(txData) + Date.now()),
        signature: sign(txData, actorGLN) // Cryptographic seal
      };
      
      // Validate the transaction
      try {
        const validation = await BlockchainEngine.validateTransaction(envelope, db);
        if (!validation.valid) {
          reject(new Error(`Transaction validation failed: ${validation.error}`));
          return;
        }
      } catch (err) {
        console.error('Transaction validation error in blockchain_submit:', err);
        reject(new Error('Transaction validation failed'));
        return;
      }

      // Get last block to link
      db.get('SELECT * FROM blockchain_blocks ORDER BY index_no DESC LIMIT 1', [], (err, lastBlock) => {
        const index = lastBlock ? lastBlock.index_no + 1 : 0;
        const prevHash = lastBlock ? lastBlock.hash : '0'.repeat(64);
        
        const newBlock = new Block(index, [envelope], prevHash);

        db.run(
          `INSERT INTO blockchain_blocks (index_no, timestamp, transactions, previousHash, hash, merkleRoot)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newBlock.index, newBlock.timestamp, JSON.stringify(newBlock.transactions), newBlock.previousHash, newBlock.hash, newBlock.merkleRoot],
          (err) => {
            if (err) reject(err);
            else resolve(newBlock.hash);
          }
        );
      });
    });
  };
};

module.exports = { registerBlockchainRoutes };
