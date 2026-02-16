import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Services
import { BlockchainService } from './blockchain.service';
import { Block, BlockSchema } from './schemas/block.schema';

// Controllers
import { BlockchainController } from './blockchain.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Block.name, schema: BlockSchema },
    ]),
  ],
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}