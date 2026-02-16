import { Injectable, Logger } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly register: Registry;
  
  // Counters
  private httpRequestCounter: Counter<string>;
  private errorCounter: Counter<string>;
  
  // Gauges
  private activeUsersGauge: Gauge<string>;
  private activeConnectionsGauge: Gauge<string>;
  
  // Histograms
  private httpRequestDuration: Histogram<string>;

  constructor() {
    this.register = new Registry();
    this.initializeMetrics();
  }

  private initializeMetrics() {
    // HTTP Request counter
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // Error counter
    this.errorCounter = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'service'],
      registers: [this.register],
    });

    // Active users gauge
    this.activeUsersGauge = new Gauge({
      name: 'active_users',
      help: 'Number of active users',
      registers: [this.register],
    });

    // Active connections gauge
    this.activeConnectionsGauge = new Gauge({
      name: 'active_connections',
      help: 'Number of active database connections',
      registers: [this.register],
    });

    // HTTP request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.5, 1, 2, 5, 10], // 0.1s, 0.5s, 1s, 2s, 5s, 10s
      registers: [this.register],
    });
  }

  // Counter methods
  incrementHttpRequest(method: string, route: string, statusCode: number) {
    this.httpRequestCounter.inc({
      method,
      route,
      status_code: statusCode.toString(),
    });
  }

  incrementError(type: string, service: string) {
    this.errorCounter.inc({
      type,
      service,
    });
  }

  // Gauge methods
  setActiveUsers(count: number) {
    this.activeUsersGauge.set(count);
  }

  setActiveConnections(count: number) {
    this.activeConnectionsGauge.set(count);
  }

  // Histogram methods
  observeHttpRequestDuration(method: string, route: string, durationSeconds: number) {
    this.httpRequestDuration.observe({ method, route }, durationSeconds);
  }

  getMetrics() {
    return this.register.metrics();
  }

  getRegistry() {
    return this.register;
  }
}