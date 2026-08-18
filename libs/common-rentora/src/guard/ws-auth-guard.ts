import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedSocket, WsJwtPayload } from '../interfaces';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();

    const token: unknown = client.handshake.auth?.token;

    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Token not provided');
    }

    try {
      const payload = this.jwtService.verify<WsJwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET1'),
      });

      client.user = {
        id: payload.sub,
        role: payload.role,
        gmail: payload.gmail,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
