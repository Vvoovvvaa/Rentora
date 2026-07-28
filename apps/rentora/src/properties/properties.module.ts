import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property, PropertyImage, User } from '@app/common-rentora/database/entity';
import { UploadModule } from '../upload/upload.module';
import { EmailModule } from '@app/common-rentora/smtp';
import { OwnerCheckGuard } from '@app/common-rentora/guard';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService],
  imports: [
    TypeOrmModule.forFeature([User,Property,PropertyImage]),
    UploadModule,
    EmailModule
    
    
  ]
})
export class PropertiesModule {}
