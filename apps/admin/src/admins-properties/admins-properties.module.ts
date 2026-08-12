import { Module } from '@nestjs/common';
import { AdminsPropertiesService } from './admins-properties.service';
import { AdminsPropertiesController } from './admins-properties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin, Property } from '@app/common-rentora/database/entity';
import { EmailModule } from '@app/common-rentora/smtp';

@Module({
  providers: [AdminsPropertiesService],
  controllers: [AdminsPropertiesController],
  imports: [
    TypeOrmModule.forFeature([Admin, Property]), EmailModule
  ]
})
export class AdminsPropertiesModule {}
