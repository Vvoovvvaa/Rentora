import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretCode, User, Usersecurity } from '@app/common-rentora/database/entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '@app/common-rentora/smtp';

@Module({
    controllers: [AuthController],
    providers: [AuthService],
    imports: [
        ConfigModule,
        EmailModule,
        TypeOrmModule.forFeature([User,Usersecurity,SecretCode]),

        JwtModule.register({
            global:true,
            secret: process.env.JWT_SECRET1,
            signOptions: {expiresIn: '1d'}
        })
    ]
})
export class AuthModule {}
