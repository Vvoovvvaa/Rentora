import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Property,
  PropertyImage,
  PropertyViews,
  Report,
  User,
} from '@app/common-rentora/database/entity';
import { UploadModule } from '../upload/upload.module';
import { EmailModule } from '@app/common-rentora/smtp';
import { PropertyPriceHistory } from '@app/common-rentora/database/entity/price-history';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Property,
      PropertyImage,
      Report,
      PropertyPriceHistory,
      PropertyViews,
    ]),
    UploadModule,
    EmailModule,
  ],
})
export class PropertiesModule {}
