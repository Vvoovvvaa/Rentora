
import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';

import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.redis.set(key, value, 'EX', ttlSeconds);
    }

    return this.redis.set(key, value);
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async delete(key: string) {
    return this.redis.del(key);
  }

  /**
   * Checks whether Redis is connected and responds to PING.
   */
  async ping(): Promise<string> {
    if (this.redis.status !== 'ready') {
      throw new Error(
        `Redis is not ready. Current status: ${this.redis.status}`,
      );
    }

    const response = await this.redis.ping();

    if (response !== 'PONG') {
      throw new Error(`Unexpected Redis response: ${response}`);
    }

    return response;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status !== 'end') {
      await this.redis.quit();
    }
  }
}
