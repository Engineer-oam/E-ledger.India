import { Injectable, Logger, HttpService } from '@nestjs/common';
import { ConfigService } from '@shared/config/config.service';
import { Cache } from 'cache-manager';
import { InjectCache } from '@nestjs/cache-manager';
import { GLNVerificationRequest, GLNVerificationResponse } from '@shared/types';

@Injectable()
export class GLNVerificationService {
  private readonly logger = new Logger(GLNVerificationService.name);
  private readonly internationalRegistries: string[];

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    @InjectCache() private cache: Cache,
  ) {
    this.internationalRegistries = this.configService.crossBorderConfig.internationalRegistries;
    this.logger.log('GLN Verification Service initialized');
  }

  async verifyGLN(request: GLNVerificationRequest): Promise<GLNVerificationResponse> {
    const cacheKey = `gln_verification_${request.gln}_${request.countryCode}`;
    
    // Check cache first
    const cachedResult = await this.cache.get<GLNVerificationResponse>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`GLN verification cache hit for ${request.gln}`);
      return {
        ...cachedResult,
        verificationTimestamp: new Date()
      };
    }

    this.logger.log(`Verifying GLN ${request.gln} for country ${request.countryCode}`);

    let verificationResult: GLNVerificationResponse;

    if (request.countryCode === 'IN') {
      // India-specific verification
      verificationResult = await this.verifyIndianGLN(request.gln);
    } else {
      // International verification
      verificationResult = await this.verifyInternationalGLN(request);
    }

    // Cache the result for 1 hour
    await this.cache.set(cacheKey, verificationResult, 3600000);

    return verificationResult;
  }

  private async verifyIndianGLN(gln: string): Promise<GLNVerificationResponse> {
    // Simulate Indian GLN verification against local registry
    // In production, this would connect to India's pharmaceutical regulatory database
    
    const isValidFormat = /^\d{13}$/.test(gln);
    const isValidChecksum = this.validateGLNChecksum(gln);
    
    const result: GLNVerificationResponse = {
      gln,
      isValid: isValidFormat && isValidChecksum,
      verificationTimestamp: new Date(),
      registrySource: 'INDIA_PHARMA_REGISTRY',
      complianceStatus: 'COMPLIANT'
    };

    if (result.isValid) {
      // Mock company data - in real implementation, fetch from database
      result.companyName = 'Indian Pharma Company Ltd';
      result.country = 'IN';
      result.entityType = 'MANUFACTURER';
    }

    return result;
  }

  private async verifyInternationalGLN(request: GLNVerificationRequest): Promise<GLNVerificationResponse> {
    // Try different international registries
    for (const registry of this.internationalRegistries) {
      try {
        const result = await this.queryInternationalRegistry(registry, request.gln, request.countryCode);
        if (result.isValid) {
          return result;
        }
      } catch (error) {
        this.logger.warn(`Failed to query registry ${registry}: ${error.message}`);
        continue;
      }
    }

    // If no registry validates, return invalid
    return {
      gln: request.gln,
      isValid: false,
      verificationTimestamp: new Date(),
      registrySource: 'NONE',
      complianceStatus: 'NON_COMPLIANT'
    };
  }

  private async queryInternationalRegistry(registry: string, gln: string, countryCode: string): Promise<GLNVerificationResponse> {
    // This would make HTTP requests to actual international registries
    // For now, simulate with mock data
    
    const mockRegistries: Record<string, any> = {
      'gs1-us': {
        isValid: Math.random() > 0.3, // 70% success rate for demo
        companyName: 'US Pharma Corp',
        country: 'US',
        entityType: 'DISTRIBUTOR'
      },
      'gs1-eu': {
        isValid: Math.random() > 0.2, // 80% success rate for demo
        companyName: 'European Medical Supplies',
        country: 'DE',
        entityType: 'RETAILER'
      },
      'gs1-apac': {
        isValid: Math.random() > 0.4, // 60% success rate for demo
        companyName: 'Asia Pacific Healthcare',
        country: 'SG',
        entityType: 'MANUFACTURER'
      }
    };

    const registryData = mockRegistries[registry] || { isValid: false };
    
    return {
      gln,
      isValid: registryData.isValid,
      companyName: registryData.companyName,
      country: registryData.country,
      entityType: registryData.entityType,
      verificationTimestamp: new Date(),
      registrySource: registry.toUpperCase(),
      complianceStatus: registryData.isValid ? 'COMPLIANT' : 'NON_COMPLIANT'
    };
  }

  private validateGLNChecksum(gln: string): boolean {
    if (gln.length !== 13) return false;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(gln[i]);
      sum += (i % 2 === 0) ? digit : digit * 3;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return parseInt(gln[12]) === checkDigit;
  }

  async batchVerifyGLNs(requests: GLNVerificationRequest[]): Promise<GLNVerificationResponse[]> {
    return Promise.all(requests.map(request => this.verifyGLN(request)));
  }

  async getVerificationStats(): Promise<any> {
    // Return verification statistics
    return {
      totalVerifications: 1000, // Mock data
      successfulVerifications: 850,
      failedVerifications: 150,
      cacheHitRate: 0.75,
      averageResponseTime: 45 // ms
    };
  }
}