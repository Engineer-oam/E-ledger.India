import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GLNVerificationService } from './gln-verification/gln-verification.service';
import { ComplianceService } from './compliance/compliance.service';
import { GLNVerificationRequest, ComplianceCheck } from '@shared/types';

@Controller('cross-border')
export class CrossBorderController {
  constructor(
    private readonly glnVerificationService: GLNVerificationService,
    private readonly complianceService: ComplianceService,
  ) {}

  @Post('verify-gln')
  async verifyGLN(@Body() request: GLNVerificationRequest) {
    return this.glnVerificationService.verifyGLN(request);
  }

  @Post('batch-verify-gln')
  async batchVerifyGLNs(@Body() requests: GLNVerificationRequest[]) {
    return this.glnVerificationService.batchVerifyGLNs(requests);
  }

  @Get('gln-stats')
  async getGLNStats() {
    return this.glnVerificationService.getVerificationStats();
  }

  @Post('check-compliance')
  async checkCompliance(@Body() complianceCheck: ComplianceCheck) {
    return this.complianceService.checkCompliance(complianceCheck);
  }

  @Post('batch-check-compliance')
  async batchCheckCompliance(@Body() checks: ComplianceCheck[]) {
    return this.complianceService.batchCheckCompliance(checks);
  }

  @Get('compliance-report')
  async getComplianceReport(
    @Query('countryCode') countryCode: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return this.complianceService.getComplianceReport(countryCode, from, to);
  }

  @Get('regulations/:countryCode')
  async getRegulations(@Param('countryCode') countryCode: string) {
    return this.complianceService.getRegulationInfo(countryCode);
  }

  @Get('status')
  async getCrossBorderStatus() {
    const [glnStats, regulations] = await Promise.all([
      this.glnVerificationService.getVerificationStats(),
      this.complianceService.getRegulationInfo('IN')
    ]);

    return {
      glnVerification: {
        enabled: true,
        stats: glnStats
      },
      compliance: {
        enabled: true,
        supportedCountries: ['IN', 'US', 'EU', 'SG'],
        regulations: regulations
      }
    };
  }
}