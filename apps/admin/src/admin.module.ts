import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAuthModule } from './auth/auth.module';

import {
  dbconfig,
  jwtconfig,
  smtpconfig,
} from '@app/common-rentora/configs';

import { IDbcongif } from '@app/common-rentora/models';
import { EmailModule } from '@app/common-rentora/smtp';
import { AdminsModule } from './admins-users/admins.module';
import { AdminsPropertiesModule } from './admins-properties/admins-properties.module';
import { SupportAdminModule } from './support-admin/support.module';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import path from 'path';
import { RedisModule } from '@app/common-rentora/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        dbconfig,
        jwtconfig,
        smtpconfig
      ],
    }),

    I18nModule.forRoot({
      fallbackLanguage: 'en',

      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },

      resolvers: [
        AcceptLanguageResolver,
      ],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService
      ) => {
        const dbconfig =
          configService.get(
            'DBCONFIG'
          ) as IDbcongif;

        return {
          type: 'postgres',
          host:
            dbconfig.POSTGRES_HOST,
          port:
            dbconfig.POSTGRES_PORT,
          username:
            dbconfig.POSTGRES_USER,
          password:
            dbconfig.POSTGRES_PASSWORD,
          database:
            dbconfig.POSTGRES_DB,

          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),

    AdminAuthModule,
    EmailModule,
    AdminsModule,
    AdminsPropertiesModule,
    SupportAdminModule,
    RedisModule
  ],

  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }