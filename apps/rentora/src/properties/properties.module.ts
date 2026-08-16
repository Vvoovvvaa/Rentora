import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property, PropertyImage, Report, User } from '@app/common-rentora/database/entity';
import { UploadModule } from '../upload/upload.module';
import { EmailModule } from '@app/common-rentora/smtp';
import { OwnerCheckGuard } from '@app/common-rentora/guard';
import { PropertyPriceHistory } from '@app/common-rentora/database/entity/price-history';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService],
  imports: [
    TypeOrmModule.forFeature([User,Property,PropertyImage,Report,PropertyPriceHistory]),
    UploadModule,
    EmailModule
    
    
  ]
})
export class PropertiesModule {}
