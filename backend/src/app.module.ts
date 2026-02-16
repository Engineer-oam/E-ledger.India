import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-yet';

// Core modules
import { ConsortiumModule } from '@consortium/consortium.module';
import { CrossBorderModule } from '@cross-border/cross-border.module';
import { BlockchainModule } from '@blockchain/blockchain.module';
import { ApiModule } from '@api/api.module';

// Shared modules
import { ConfigService } from '@shared/config/config.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database - MongoDB sharded cluster
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
        connectionFactory: (connection) => {
          // Enable sharding configuration
          connection.plugin(require('mongoose-sharding'));
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    
    // Redis Cache for 70K TPS performance
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: configService.get('CACHE_TTL'),
        max: configService.get('CACHE_MAX'),
      }),
      inject: [ConfigService],
    }),
    
    // Core functional modules
    ConsortiumModule,
    CrossBorderModule,
    BlockchainModule,
    ApiModule,
  ],
})
export class AppModule {}