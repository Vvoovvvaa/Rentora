
import { Controller, Get } from '@nestjs/common';

import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { RedisHealthIndicator } from './redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  /**
   * Checks whether the NestJS process is alive.
   */
  @Get('live')
  live() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Checks whether the application is ready
   * to process incoming requests.
   */
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () =>
        this.database
          .pingCheck('postgres')
          .withTimeout(1000),

      () =>
        this.redis.isHealthy('redis'),
    ]);
  }
}
