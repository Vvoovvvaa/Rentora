import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { validationSchema } from '@app/common-rentora/validation';
import {
  cloudinaryConfig,
  dbconfig,
  jwtconfig,
  smtpconfig,
} from '@app/common-rentora/configs';
import { IDbcongif } from '@app/common-rentora/models';
import {
  Admin,
  AdminSecretcode,
  Agency,
  AgencyImage,
  ChatRoom,
  Favorites,
  Message,
  Property,
  PropertyAnalytic,
  PropertyImage,
  PropertyViews,
  Report,
  SecretCode,
  Support,
  User,
  UserImage,
  UserSecurity,
} from '@app/common-rentora/database/entity';
import { EmailModule } from '@app/common-rentora/smtp';
import { PropertiesModule } from './properties/properties.module';
import { SearchModule } from './search/search.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { SupportModule } from './support/support.module';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import path from 'path';
import { PropertyPriceHistory } from '@app/common-rentora/database/entity/price-history';
import { RedisModule } from '@app/common-rentora/redis/redis.module';
import { AiModule } from './ai/ai.module';
import { AnalyticModule } from './analytic/analytic.module';
import { UserSubscription } from '@app/common-rentora/database/entity/subscription-plan';
import { SubscriptionConfig } from '@app/common-rentora/database/entity/subscription-config';
import { SubscriptionModule } from './subscription/subscription.module';
import { AgencyModule } from './agency/agency.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    PropertiesModule,
    SearchModule,
    UserModule,
    ChatModule,
    SupportModule,
    RedisModule,
    AiModule,
    AnalyticModule,
    SubscriptionModule,
    AgencyModule,
    HealthModule,

    ScheduleModule.forRoot(),

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

        transport:
          process.env.NODE_ENV !== 'production'
            ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:standard',
              },
            }
            : undefined,

        genReqId: (req, res) => {
          const requestId = randomUUID();

          res.setHeader('X-Request-ID', requestId);

          return requestId;
        },

        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers.set-cookie',
          ],
          remove: true,
        },
      },
    }),


    I18nModule.forRoot({
      fallbackLanguage: 'en',

      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },

      resolvers: [AcceptLanguageResolver],
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [jwtconfig, dbconfig, smtpconfig, cloudinaryConfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbconfig: IDbcongif = configService.get('DBCONFIG') as IDbcongif;

        return {
          type: 'postgres',
          host: dbconfig.POSTGRES_HOST,
          port: dbconfig.POSTGRES_PORT,
          username: dbconfig.POSTGRES_USER,
          password: dbconfig.POSTGRES_PASSWORD,
          database: dbconfig.POSTGRES_DB,
          entities: [
            User,
            UserSecurity,
            SecretCode,
            Property,
            PropertyImage,
            UserImage,
            Favorites,
            Report,
            Admin,
            PropertyViews,
            AdminSecretcode,
            Support,
            PropertyPriceHistory,
            PropertyAnalytic,
            UserSubscription,
            SubscriptionConfig,
            Agency,
            AgencyImage,
            ChatRoom,
            Message
          ],
          synchronize: true,
          // dropSchema: true,

        }
      },
    }),
  ],

  controllers: [AppController,],
  providers: [AppService],
})
export class AppModule { }
