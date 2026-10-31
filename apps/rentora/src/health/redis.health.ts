import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorService,
} from '@nestjs/terminus';

import { RedisService } from '@app/common-rentora/redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redisService: RedisService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  isHealthy(key: string = 'redis') {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        const response = await this.redisService.ping();

        return {
          response,
        };
      })
      .withTimeout(1000);
  }
}
