import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { RedisService } from '../redis/redis.service';

interface UserJwtPayload {
  sub: number;
  role: string;
  phone?: string;
  temp?: boolean;
  jti: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedUser {
  id: number;
  role: string;
  phone?: string;
  temp: boolean;
  jti: string;
}

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('You are not authorized, please login');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    let payload: UserJwtPayload;

    try {
      payload = this.jwtService.verify<UserJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      try {
        payload = this.jwtService.verify<UserJwtPayload>(token, {
          secret: this.configService.getOrThrow<string>('JWT_SECRET1'),
        });
      } catch {
        throw new UnauthorizedException('User is not authorized');
      }
    }

    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token');
    }

    const blacklisted = await this.redisService.get(
      `blacklist:token:${payload.jti}`,
    );

    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const blockedUser = await this.redisService.get(
      `blocked:user:${payload.sub}`,
    );

    if (blockedUser) {
      throw new UnauthorizedException('Your account has been blocked');
    }

    request.user = {
      id: payload.sub,
      role: payload.role,
      phone: payload.phone,
      temp: payload.temp ?? false,
      jti: payload.jti,
    };

    return true;
  }
}
