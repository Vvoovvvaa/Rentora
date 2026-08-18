import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Favorites,
  Property,
  User,
  UserImage,
  UserSecurity,
} from '@app/common-rentora/database/entity';
import { UserService } from './user.service';
import { UploadService } from '../upload/upload.service';
import { EmailModule } from '@app/common-rentora/smtp';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserImage,
      UserSecurity,
      Favorites,
      Property,
    ]),
    EmailModule,
  ],
  controllers: [UserController],
  providers: [UserService, UploadService],
})
export class UserModule {}
