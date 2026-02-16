import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get(key: string): any {
    return this.configService.get(key);
  }

  // Database Configuration
  get databaseConfig() {
    return {
      uri: this.get('MONGODB_URI'),
      options: {
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    };
  }

  // Redis Configuration
  get redisConfig() {
    return {
      host: this.get('REDIS_HOST') || 'localhost',
      port: parseInt(this.get('REDIS_PORT') || '6379'),
      password: this.get('REDIS_PASSWORD'),
      db: parseInt(this.get('REDIS_DB') || '0'),
    };
  }

  // Kafka Configuration
  get kafkaConfig() {
    return {
      clientId: 'e-ledger-backend',
      brokers: (this.get('KAFKA_BROKERS') || 'localhost:9092').split(','),
      connectionTimeout: 3000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    };
  }

  // Consortium Configuration
  get consortiumConfig() {
    return {
      targetTPS: parseInt(this.get('TARGET_TPS') || '70000'),
      shardCount: parseInt(this.get('SHARD_COUNT') || '10'),
      nodesPerShard: parseInt(this.get('NODES_PER_SHARD') || '3'),
      indiaSpecific: this.get('INDIA_SPECIFIC') === 'true',
    };
  }

  // Cross-border Configuration
  get crossBorderConfig() {
    return {
      glnVerificationEnabled: this.get('GLN_VERIFICATION_ENABLED') === 'true',
      internationalRegistries: (this.get('INTERNATIONAL_REGISTRIES') || '').split(','),
      complianceCheckEnabled: this.get('COMPLIANCE_CHECK_ENABLED') === 'true',
    };
  }

  // Security Configuration
  get securityConfig() {
    return {
      jwtSecret: this.get('JWT_SECRET'),
      jwtExpiresIn: this.get('JWT_EXPIRES_IN') || '24h',
      bcryptSaltRounds: parseInt(this.get('BCRYPT_SALT_ROUNDS') || '12'),
    };
  }
}