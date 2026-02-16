import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      defaultMeta: { service: 'e-ledger' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(message, { context });
    }
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for specific logging needs
  logApiRequest(method: string, url: string, statusCode: number, responseTime: number, ip: string) {
    this.logger.info('API Request', {
      type: 'api-request',
      method,
      url,
      statusCode,
      responseTime,
      ip,
    });
  }

  logPerformance(metric: string, value: number, tags?: Record<string, any>) {
    this.logger.info('Performance Metric', {
      type: 'performance',
      metric,
      value,
      ...tags,
    });
  }

  logSecurityEvent(event: string, userId?: string, ip?: string, details?: Record<string, any>) {
    this.logger.info('Security Event', {
      type: 'security',
      event,
      userId,
      ip,
      ...details,
    });
  }

  logBusinessEvent(event: string, userId?: string, data?: Record<string, any>) {
    this.logger.info('Business Event', {
      type: 'business',
      event,
      userId,
      ...data,
    });
  }
}