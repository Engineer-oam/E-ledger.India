import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { HealthCheckService } from '../services/health-check.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private healthCheckService: HealthCheckService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async checkHealth() {
    return this.healthCheckService.checkHealth();
  }

  @Public()
  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  async getDetailedHealth() {
    return this.healthCheckService.getDetailedHealth();
  }
}