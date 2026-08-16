import { Get, Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {

    private readonly redis: Redis
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
        })
    }

    async set(key: string, value: string, ttlSeconds?: number) {
        if (ttlSeconds) {
            return this.redis.set(
                key, value, "EX", ttlSeconds
            )
        }

        return this.redis.set(key, value)
    }

    async get(key: string) {
        return this.redis.get(key)
    }

    async delete(key: string) {
        return this.redis.del(key)
    }

    async onModuleDestroy() {
        return this.redis.quit()
    }
}