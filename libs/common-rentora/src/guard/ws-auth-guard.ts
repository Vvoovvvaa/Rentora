import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';


@Injectable()
export class WsAuthGuard implements CanActivate {

    constructor(
        private readonly jwtService: JwtService
    ) {}


    canActivate(
        context: ExecutionContext
    ): boolean {


        const client =
            context.switchToWs().getClient();


        const token =
            client.handshake.auth?.token;


        if(!token){
            throw new UnauthorizedException(
                'Token not provided'
            );
        }


        try {

            const payload =
                this.jwtService.verify(token,{
                    secret: process.env.JWT_SECRET1
                });


            client.user = {
                id: payload.sub,
                role: payload.role,
                gmail: payload.gmail
            };


            return true;


        } catch(error) {

            throw new UnauthorizedException(
                'Invalid token'
            );

        }

    }

}