import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Agency,
  Property,
  PropertyImage,
  PropertyViews,
  Report,
  User,
} from '@app/common-rentora/database/entity';
import { UploadModule } from '../upload/upload.module';
import { EmailModule } from '@app/common-rentora/smtp';
import { PropertyPriceHistory } from '@app/common-rentora/database/entity/price-history';
import { UserSubscription } from '@app/common-rentora/database/entity/subscription-plan';
import { SubscriptionConfig } from '@app/common-rentora/database/entity/subscription-config';
import { SubscriptionModule } from '../subscription/subscription.module';
import { BoopsExpirationService } from './crons/boops-expiration.service';
import { ListingExpirationserivce } from './crons/listing-expiration.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, BoopsExpirationService, ListingExpirationserivce],
  imports: [
    TypeOrmModule.forFeature([
      User,
      Property,
      PropertyImage,
      Report,
      PropertyPriceHistory,
      PropertyViews,
      UserSubscription,
      SubscriptionConfig,
      Agency,
    ]),
    UploadModule,
    EmailModule,
    SubscriptionModule,
  ],
})
export class PropertiesModule {}
