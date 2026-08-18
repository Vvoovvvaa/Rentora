import { Module } from '@nestjs/common';
import { AdminsPropertiesService } from './admins-properties.service';
import { AdminsPropertiesController } from './admins-properties.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Admin,
  Property,
  PropertyViews,
} from '@app/common-rentora/database/entity';
import { EmailModule } from '@app/common-rentora/smtp';
import { PropertyPriceHistory } from '@app/common-rentora/database/entity/price-history';

@Module({
  providers: [AdminsPropertiesService],
  controllers: [AdminsPropertiesController],
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      Property,
      PropertyPriceHistory,
      PropertyViews,
    ]),
    EmailModule,
  ],
})
export class AdminsPropertiesModule {}
