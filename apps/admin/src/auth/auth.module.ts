import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Admin } from '@app/common-rentora/database/entity/admin';
import { AdminSecretcode } from '@app/common-rentora/database/entity';
import { AdminAuthController } from './auth.controller';
import { AdminAuthService } from './auth.service';
import { AdminAuthGuard } from '@app/common-rentora/guard';
import { EmailModule } from '@app/common-rentora/smtp';
import { JwtConfig } from '@app/common-rentora/interfaces';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, AdminSecretcode]),
    EmailModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,

      useFactory: (configService: ConfigService) => {
        const jwtConfig = configService.getOrThrow<JwtConfig>('JWTCONFIG');

        return {
          secret: jwtConfig.JWT_SECRET2,
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
    }),
  ],

  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAuthGuard],
})
export class AdminAuthModule {}
