import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = context.getClass().name + '.' + context.getHandler().name;
    
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        
        // Log slow requests (over 100ms)
        if (responseTime > 100) {
          this.logger.warn(`${method} took ${responseTime}ms`);
        }
      }),
    );
  }
}