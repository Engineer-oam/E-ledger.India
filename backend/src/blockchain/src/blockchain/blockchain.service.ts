import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@shared/config/config.service';
import { CryptoUtils } from '@shared/utils';
import { Block, BlockDocument } from './schemas/block.schema';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private genesisBlock: Block | null = null;

  constructor(
    @InjectModel(Block.name) private blockModel: Model<BlockDocument>,
    private configService: ConfigService,
  ) {
    this.initializeGenesisBlock();
  }

  private async initializeGenesisBlock(): Promise<void> {
    const existingBlocks = await this.blockModel.countDocuments();
    
    if (existingBlocks === 0) {
      this.logger.log('Creating genesis block for blockchain');
      
      const genesisData = {
        index: 0,
        timestamp: new Date(),
        transactions: [{ type: 'GENESIS', message: 'E-Ledger Mainnet Genesis Block' }],
        previousHash: '0'.repeat(64),
        nonce: 0
      };

      const genesisHash = CryptoUtils.generateHash({
        index: genesisData.index,
        timestamp: genesisData.timestamp,
        transactions: genesisData.transactions,
        previousHash: genesisData.previousHash,
        nonce: genesisData.nonce
      });

      const merkleRoot = CryptoUtils.generateHash(genesisData.transactions);

      this.genesisBlock = new this.blockModel({
        ...genesisData,
        hash: genesisHash,
        merkleRoot
      });

      await this.genesisBlock.save();
      this.logger.log('Genesis block created successfully');
    } else {
      this.genesisBlock = await this.blockModel.findOne({ index: 0 });
      this.logger.log('Genesis block loaded from database');
    }
  }

  async createBlock(transactions: any[], validatorGLN?: string): Promise<Block> {
    const lastBlock = await this.getLastBlock();
    const newIndex = lastBlock ? lastBlock.index + 1 : 0;
    
    const blockData = {
      index: newIndex,
      timestamp: new Date(),
      transactions,
      previousHash: lastBlock ? lastBlock.hash : '0'.repeat(64),
      nonce: 0
    };

    // Simple proof of work (in production, use more sophisticated consensus)
    const { hash, nonce } = this.mineBlock(blockData);
    
    const merkleRoot = this.calculateMerkleRoot(transactions);

    const newBlock = new this.blockModel({
      ...blockData,
      hash,
      nonce,
      merkleRoot,
      validator: validatorGLN
    });

    const savedBlock = await newBlock.save();
    this.logger.log(`New block created: ${savedBlock.hash} at index ${savedBlock.index}`);
    
    return savedBlock;
  }

  private mineBlock(blockData: any): { hash: string; nonce: number } {
    let nonce = 0;
    let hash: string;
    
    do {
      nonce++;
      hash = CryptoUtils.generateHash({
        ...blockData,
        nonce
      });
    } while (!hash.startsWith('0000')); // Simple difficulty target
    
    return { hash, nonce };
  }

  private calculateMerkleRoot(transactions: any[]): string {
    if (transactions.length === 0) return CryptoUtils.generateHash('empty');
    
    const hashes = transactions.map(tx => CryptoUtils.generateHash(tx));
    
    // Simple merkle tree implementation
    let currentLevel = hashes;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          nextLevel.push(CryptoUtils.generateHash(currentLevel[i] + currentLevel[i + 1]));
        } else {
          nextLevel.push(currentLevel[i]); // Odd number of elements
        }
      }
      currentLevel = nextLevel;
    }
    
    return currentLevel[0];
  }

  async getLastBlock(): Promise<Block | null> {
    return this.blockModel.findOne().sort({ index: -1 });
  }

  async getBlockByHash(hash: string): Promise<Block | null> {
    return this.blockModel.findOne({ hash });
  }

  async getBlockByIndex(index: number): Promise<Block | null> {
    return this.blockModel.findOne({ index });
  }

  async getBlockchain(): Promise<Block[]> {
    return this.blockModel.find().sort({ index: 1 });
  }

  async validateChain(): Promise<boolean> {
    const chain = await this.getBlockchain();
    
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      // Validate hash integrity
      const expectedHash = CryptoUtils.generateHash({
        index: currentBlock.index,
        timestamp: currentBlock.timestamp,
        transactions: currentBlock.transactions,
        previousHash: currentBlock.previousHash,
        nonce: currentBlock.nonce
      });

      if (currentBlock.hash !== expectedHash) {
        this.logger.error(`Invalid hash at block ${currentBlock.index}`);
        return false;
      }

      // Validate chain linkage
      if (currentBlock.previousHash !== previousBlock.hash) {
        this.logger.error(`Invalid chain linkage at block ${currentBlock.index}`);
        return false;
      }
    }

    return true;
  }

  async getBlockchainStats(): Promise<any> {
    const totalBlocks = await this.blockModel.countDocuments();
    const lastBlock = await this.getLastBlock();
    
    return {
      totalBlocks,
      latestBlock: lastBlock ? lastBlock.index : -1,
      latestBlockHash: lastBlock ? lastBlock.hash : null,
      chainValid: await this.validateChain()
    };
  }
}