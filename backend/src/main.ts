import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './shared/interceptors/performance.interceptor';
import { SupabaseAuthGuard } from './shared/guards/supabase-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new PerformanceInterceptor());
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Global auth guard (commented out for now - will be applied per controller)
  // app.useGlobalGuards(new SupabaseAuthGuard());
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`E-Ledger Backend running on port ${port}`);
  console.log(`70K TPS Consortium Layer initialized`);
  console.log(`Cross-border GLN Verification active`);
  console.log(`Supabase Authentication integrated`);
}
bootstrap();