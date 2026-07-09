import {CanActivate,ExecutionContext,Injectable,UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('You are not authorized, please login');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
    } catch (err1) {
      try {
        payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET1,
        });
      } catch (err2) {
        throw new UnauthorizedException('User is not authorized');
      }
    }

    request.user = {
      id: payload.sub,
      role: payload.role,
      phone: payload.phone,
      temp: payload.temp ?? false,
    };

    return true;
  }
}