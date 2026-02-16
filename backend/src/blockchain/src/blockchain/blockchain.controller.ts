import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('stats')
  async getBlockchainStats() {
    return this.blockchainService.getBlockchainStats();
  }

  @Get('blocks')
  async getBlockchain() {
    return this.blockchainService.getBlockchain();
  }

  @Get('blocks/latest')
  async getLatestBlock() {
    return this.blockchainService.getLastBlock();
  }

  @Get('blocks/:hash')
  async getBlockByHash(@Param('hash') hash: string) {
    return this.blockchainService.getBlockByHash(hash);
  }

  @Get('blocks/index/:index')
  async getBlockByIndex(@Param('index') index: number) {
    return this.blockchainService.getBlockByIndex(index);
  }

  @Post('blocks')
  async createBlock(@Body() createBlockDto: any) {
    const { transactions, validatorGLN } = createBlockDto;
    return this.blockchainService.createBlock(transactions, validatorGLN);
  }

  @Get('validate')
  async validateChain() {
    const isValid = await this.blockchainService.validateChain();
    return {
      valid: isValid,
      timestamp: new Date().toISOString()
    };
  }
}