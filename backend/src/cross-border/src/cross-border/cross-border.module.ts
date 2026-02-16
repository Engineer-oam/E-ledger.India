import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

// Services
import { GLNVerificationService } from './gln-verification/gln-verification.service';
import { ComplianceService } from './compliance/compliance.service';

// Controllers
import { CrossBorderController } from './cross-border.controller';

@Module({
  imports: [
    HttpModule,
    CacheModule.register(),
  ],
  controllers: [CrossBorderController],
  providers: [
    GLNVerificationService,
    ComplianceService,
  ],
  exports: [
    GLNVerificationService,
    ComplianceService,
  ],
})
export class CrossBorderModule {}