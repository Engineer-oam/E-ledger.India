import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';

// Services
import { ConsortiumService } from './consortium.service';
import { ShardingService } from './sharding/sharding.service';
import { NodeService } from './nodes/node.service';
import { RoutingService } from './routing/routing.service';

// Controllers
import { ConsortiumController } from './consortium.controller';

// Schemas
import { ConsortiumNode, ConsortiumNodeSchema } from './schemas/consortium-node.schema';
import { Shard, ShardSchema } from './schemas/shard.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConsortiumNode.name, schema: ConsortiumNodeSchema },
      { name: Shard.name, schema: ShardSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    CacheModule.register(),
  ],
  controllers: [ConsortiumController],
  providers: [
    ConsortiumService,
    ShardingService,
    NodeService,
    RoutingService,
  ],
  exports: [
    ConsortiumService,
    ShardingService,
    NodeService,
    RoutingService,
  ],
})
export class ConsortiumModule {}