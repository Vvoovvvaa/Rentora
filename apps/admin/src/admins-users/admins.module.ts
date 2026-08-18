import {
  Admin,
  AdminSecretcode,
  Favorites,
  Property,
  PropertyImage,
  Report,
  SecretCode,
  User,
  UserImage,
  UserSecurity,
} from '@app/common-rentora/database/entity';
import { EmailModule } from '@app/common-rentora/smtp';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';
import { AdminAuthGuard } from '@app/common-rentora/guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      User,
      UserSecurity,
      SecretCode,
      Property,
      UserImage,
      Favorites,
      Report,
      PropertyImage,
      AdminSecretcode,
    ]),
    EmailModule,
  ],
  controllers: [AdminsController],
  providers: [AdminsService, AdminAuthGuard],
})
export class AdminsModule {}
