
const { hash } = require('./crypto');

class Block {
  constructor(index, transactions, previousHash = '') {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.merkleRoot = this.calculateMerkleRoot(transactions);
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return hash(
      this.index + 
      this.previousHash + 
      this.timestamp + 
      this.merkleRoot + 
      this.nonce
    );
  }

  calculateMerkleRoot(transactions) {
    if (transactions.length === 0) return hash('empty');
    const hashes = transactions.map(tx => hash(tx));
    // Simple Merkle Root simulation (concat + hash)
    return hash(hashes.join(''));
  }
}

const BlockchainEngine = {
  createGenesisBlock: () => {
    return new Block(0, [{ type: 'GENESIS', message: 'E-Ledger Mainnet Genesis Block' }], '0'.repeat(64));
  },

  validateChain: (chain) => {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // 1. Check if current hash is valid
      if (currentBlock.hash !== currentBlock.calculateHash()) return false;
      
      // 2. Check if linked to previous
      if (currentBlock.previousHash !== previousBlock.hash) return false;
    }
    return true;
  },

  validateTransaction: (transaction, db) => {
    return new Promise((resolve, reject) => {
      // 1. Verify signature
      const isValidSignature = require('./crypto').verify(transaction.payload, transaction.signature, transaction.actor);
      if (!isValidSignature) {
        return resolve({ valid: false, error: 'Invalid signature' });
      }
      
      // 2. Verify transaction structure
      if (!transaction.txId || !transaction.payload || !transaction.actor || !transaction.timestamp) {
        return resolve({ valid: false, error: 'Missing required transaction fields' });
      }
      
      // 3. Check if transaction ID is unique
      db.get('SELECT txId FROM pending_transactions WHERE txId = ?', [transaction.txId], (err, row) => {
        if (err) return reject(err);
        if (row) {
          return resolve({ valid: false, error: 'Duplicate transaction ID' });
        }
        
        // 4. Verify that actor exists in users table
        db.get('SELECT gln FROM users WHERE gln = ?', [transaction.actor], (err, userRow) => {
          if (err) return reject(err);
          if (!userRow) {
            return resolve({ valid: false, error: 'Unknown actor GLN' });
          }
          
          resolve({ valid: true });
        });
      });
    });
  }
};

module.exports = { Block, BlockchainEngine };
