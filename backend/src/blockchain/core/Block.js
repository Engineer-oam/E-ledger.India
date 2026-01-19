const crypto = require('crypto');
const Transaction = require('./Transaction');

class Block {
  constructor(index, transactions, previousHash = '', timestamp = null) {
    this.index = index;
    this.timestamp = timestamp || new Date().toISOString();
    this.transactions = transactions.map(tx => tx instanceof Transaction ? tx : new Transaction(tx));
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  /**
   * Calculate the SHA-256 hash of the block
   */
  calculateHash() {
    const dataToHash = this.index + 
                       this.previousHash + 
                       this.timestamp + 
                       JSON.stringify(this.transactions.map(tx => tx.toJSON())) + 
                       this.nonce;
    
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Perform proof-of-work mining to find a valid hash
   */
  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    
    return this.hash;
  }

  /**
   * Validate all transactions in the block
   */
  hasValidTransactions() {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Convert block to JSON representation
   */
  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions.map(tx => tx.toJSON()),
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash
    };
  }

  /**
   * Create a block from JSON data
   */
  static fromJSON(jsonData) {
    const block = new Block(
      jsonData.index,
      jsonData.transactions,
      jsonData.previousHash,
      jsonData.timestamp
    );
    block.nonce = jsonData.nonce;
    block.hash = jsonData.hash;
    return block;
  }
}

module.exports = Block;