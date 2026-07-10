import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Usersecurity } from '@app/common-rentora/database/entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
    controllers: [AuthController],
    providers: [AuthService],
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([User,Usersecurity]),

        JwtModule.register({
            global:true,
            secret: process.env.JWT_SECRET1,
            signOptions: {expiresIn: '1d'}
        })
    ]
})
export class AuthModule {}
