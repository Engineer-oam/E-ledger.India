import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class CryptoUtils {
  static generateHash(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  static generateUUID(): string {
    return uuidv4();
  }

  static sign(data: any, privateKey: string): string {
    const dataString = JSON.stringify(data);
    return crypto
      .createHmac('sha256', privateKey)
      .update(dataString)
      .digest('hex');
  }

  static verifySignature(data: any, signature: string, publicKey: string): boolean {
    const expectedSignature = this.sign(data, publicKey);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    return { publicKey, privateKey };
  }
}

export class PerformanceUtils {
  private static startTime: number;

  static startTimer(): void {
    this.startTime = Date.now();
  }

  static endTimer(): number {
    if (!this.startTime) return 0;
    const elapsed = Date.now() - this.startTime;
    this.startTime = 0;
    return elapsed;
  }

  static calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * (sorted.length - 1));
    return sorted[index];
  }

  static calculateMetrics(latencies: number[]): {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  } {
    if (latencies.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0 };
    }

    return {
      p50: this.calculatePercentile(latencies, 50),
      p95: this.calculatePercentile(latencies, 95),
      p99: this.calculatePercentile(latencies, 99),
      avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    };
  }
}

export class ValidationUtils {
  static isValidGLN(gln: string): boolean {
    // GLN format: 13 digits
    const glnRegex = /^\d{13}$/;
    return glnRegex.test(gln);
  }

  static isValidGTIN(gtin: string): boolean {
    // GTIN can be 8, 12, 13, or 14 digits
    const gtinRegex = /^(\d{8}|\d{12}|\d{13}|\d{14})$/;
    return gtinRegex.test(gtin);
  }

  static isValidBatchId(batchId: string): boolean {
    // Custom batch ID format
    const batchRegex = /^[A-Z0-9]{8,20}$/;
    return batchRegex.test(batchId);
  }

  static validateDateRange(from: Date, to: Date): boolean {
    return from <= to;
  }
}

export class ShardingUtils {
  static getShardId(identifier: string, shardCount: number): string {
    const hash = CryptoUtils.generateHash(identifier);
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const shardIndex = hashInt % shardCount;
    return `shard-${shardIndex.toString().padStart(3, '0')}`;
  }

  static getHashRange(shardId: string, totalShards: number): { start: string; end: string } {
    const shardIndex = parseInt(shardId.split('-')[1]);
    const rangeSize = Math.pow(2, 32) / totalShards;
    const start = (shardIndex * rangeSize).toString(16).padStart(8, '0');
    const end = ((shardIndex + 1) * rangeSize - 1).toString(16).padStart(8, '0');
    return { start, end };
  }
}