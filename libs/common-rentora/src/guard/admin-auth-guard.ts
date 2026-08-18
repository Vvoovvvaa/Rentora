import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { AdminAuthUser, AdminJwtPayload } from '../interfaces';

type AdminRequest = Request & {
  user?: AdminAuthUser;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Admin token not provided');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid bearer admin token');
    }

    let payload: AdminJwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<AdminJwtPayload>(token);
    } catch (error: unknown) {
      console.log('JWT ERROR:', error);

      throw new UnauthorizedException('Invalid or expired bearer admin token');
    }

    if (payload.type !== 'ADMIN') {
      throw new UnauthorizedException('Admin token required');
    }

    request.user = {
      id: payload.sub,
      gmail: payload.gmail,
      role: payload.role,
      type: payload.type,
    };

    return true;
  }
}
