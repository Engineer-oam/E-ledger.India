import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

export interface HealthIndicatorResult {
  status: 'up' | 'down';
  details?: any;
  error?: string;
}

@Injectable()
export class HealthCheckService {
  constructor(private configService: ConfigService) {}

  async checkHealth(): Promise<Record<string, HealthIndicatorResult>> {
    const healthResults: Record<string, HealthIndicatorResult> = {};

    // Check database connectivity
    healthResults.database = await this.checkDatabaseHealth();

    // Check cache connectivity
    healthResults.cache = await this.checkCacheHealth();

    // Check external services
    healthResults.externalServices = await this.checkExternalServicesHealth();

    // Overall health status
    const allUp = Object.values(healthResults).every(result => result.status === 'up');
    healthResults.overall = {
      status: allUp ? 'up' : 'down',
      details: { timestamp: new Date().toISOString() }
    };

    return healthResults;
  }

  private async checkDatabaseHealth(): Promise<HealthIndicatorResult> {
    try {
      // In a real implementation, this would connect to the actual database
      // For now, we'll simulate a check
      const dbUri = this.configService.get('MONGODB_URI');
      if (!dbUri) {
        return {
          status: 'down',
          error: 'Database URI not configured',
          details: { configured: false }
        };
      }

      // Simulate DB connection check
      // In a real implementation, you'd ping the database here
      return {
        status: 'up',
        details: { 
          connected: true, 
          host: new URL(dbUri).hostname,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        details: { connected: false, timestamp: new Date().toISOString() }
      };
    }
  }

  private async checkCacheHealth(): Promise<HealthIndicatorResult> {
    try {
      // In a real implementation, this would connect to the actual cache
      const redisHost = this.configService.get('REDIS_HOST');
      const redisPort = this.configService.get('REDIS_PORT');

      if (!redisHost || !redisPort) {
        return {
          status: 'down',
          error: 'Redis not configured',
          details: { configured: false }
        };
      }

      // Simulate cache connection check
      // In a real implementation, you'd ping Redis here
      return {
        status: 'up',
        details: { 
          connected: true, 
          host: redisHost,
          port: redisPort,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        details: { connected: false, timestamp: new Date().toISOString() }
      };
    }
  }

  private async checkExternalServicesHealth(): Promise<HealthIndicatorResult> {
    try {
      // Check external service dependencies
      // This would typically include services like payment gateways, email services, etc.
      return {
        status: 'up',
        details: {
          services: ['gln-registry', 'compliance-api'],
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        details: { timestamp: new Date().toISOString() }
      };
    }
  }

  async getDetailedHealth(): Promise<any> {
    const basicHealth = await this.checkHealth();
    const detailedInfo = {
      ...basicHealth,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: { load_average: require('os').loadavg()[0] },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || 'unknown',
      config: {
        database_configured: !!this.configService.get('MONGODB_URI'),
        redis_configured: !!this.configService.get('REDIS_HOST'),
        kafka_configured: !!this.configService.get('KAFKA_BROKERS')
      }
    };

    return detailedInfo;
  }
}