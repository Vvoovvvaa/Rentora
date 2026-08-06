import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';


import { AuthModule } from './auth/auth.module';
import { validationSchema } from '@app/common-rentora/validation';
import { cloudinaryConfig, dbconfig, jwtconfig, smtpconfig } from '@app/common-rentora/configs';
import { IDbcongif } from '@app/common-rentora/models';
import { Favorites, Property, PropertyImage, SecretCode, User, UserImage, UserSecurity } from '@app/common-rentora/database/entity';
import { EmailModule } from '@app/common-rentora/smtp';
import { PropertiesModule } from './properties/properties.module';
import { SearchModule } from './search/search.module';
import { UserModule } from './user/user.module';
import { ChatService } from './chat/chat.service';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    PropertiesModule,
    SearchModule,
    UserModule,
    ChatModule,
    

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
          entities: [User, UserSecurity, SecretCode, Property,PropertyImage,UserImage, Favorites],
          autoLoadEntities: true,
          synchronize: true,
          // dropSchema: true,
        };
      },
    }),


    

  ],

  controllers: [AppController],
  providers: [AppService,],
})
export class AppModule { }