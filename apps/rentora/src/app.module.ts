import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from '@app/common-rentora/validation';
import { dbconfig, jwtconfig, smtpconfig } from '@app/common-rentora/configs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IDbcongif } from '@app/common-rentora/models';
import { SecretCode, User, Usersecurity } from '@app/common-rentora/database/entity';
import { EmailModule } from '@app/common-rentora/smtp';

@Module({
  imports: [
    AuthModule,
    EmailModule,

    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [jwtconfig,dbconfig,smtpconfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbconfig: IDbcongif =  configService.get("DBCONFIG") as IDbcongif;

        return {
          type: 'postgres',
          host: dbconfig.POSTGRES_HOST,
          port: dbconfig.POSTGRES_PORT,
          username: dbconfig.POSTGRES_USER,
          password: dbconfig.POSTGRES_PASSWORD,
          database: dbconfig.POSTGRES_DB,
          entities: [User,Usersecurity,SecretCode],
          autoLoadEntities: true,
          synchronize: true,
          // dropSchema: true,
        };
      },
    }),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}