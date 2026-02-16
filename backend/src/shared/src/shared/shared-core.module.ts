import { Module, Global } from '@nestjs/common';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { PerformanceInterceptor } from '../interceptors/performance.interceptor';
import { ValidationPipe } from '@nestjs/common';

@Global()
@Module({
  providers: [
    HttpExceptionFilter,
    LoggingInterceptor,
    PerformanceInterceptor,
    ValidationPipe,
  ],
  exports: [
    HttpExceptionFilter,
    LoggingInterceptor,
    PerformanceInterceptor,
    ValidationPipe,
  ],
})
export class SharedCoreModule {}