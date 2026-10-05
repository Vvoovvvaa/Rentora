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
import { UserSubscription } from '@app/common-rentora/database/entity/subscription-plan';
import { SubscriptionConfig } from '@app/common-rentora/database/entity/subscription-config';

@Module({
  providers: [AdminsPropertiesService],
  controllers: [AdminsPropertiesController],
  imports: [
    TypeOrmModule.forFeature([
      Admin,
      Property,
      PropertyPriceHistory,
      PropertyViews,
      UserSubscription,
      SubscriptionConfig,
    ]),
    EmailModule,
  ],
})
export class AdminsPropertiesModule {}
