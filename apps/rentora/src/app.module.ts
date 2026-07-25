import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';


import { AuthModule } from './auth/auth.module';
import { validationSchema } from '@app/common-rentora/validation';
import { cloudinaryConfig, dbconfig, jwtconfig, smtpconfig } from '@app/common-rentora/configs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IDbcongif } from '@app/common-rentora/models';
import { Property, PropertyImage, SecretCode, User, Usersecurity } from '@app/common-rentora/database/entity';
import { EmailModule } from '@app/common-rentora/smtp';
import { PropertiesModule } from './properties/properties.module';
import { SearchService } from './search/search.service';
import { SearchController } from './search/search.controller';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    PropertiesModule,


    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [jwtconfig, dbconfig, smtpconfig, cloudinaryConfig],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbconfig: IDbcongif = configService.get("DBCONFIG") as IDbcongif;

        return {
          type: 'postgres',
          host: dbconfig.POSTGRES_HOST,
          port: dbconfig.POSTGRES_PORT,
          username: dbconfig.POSTGRES_USER,
          password: dbconfig.POSTGRES_PASSWORD,
          database: dbconfig.POSTGRES_DB,
          entities: [User, Usersecurity, SecretCode, Property,PropertyImage],
          autoLoadEntities: true,
          synchronize: true,
          // dropSchema: true,
        };
      },
    }),

    SearchModule,
  ],

  controllers: [AppController, SearchController],
  providers: [AppService, SearchService],
})
export class AppModule { }