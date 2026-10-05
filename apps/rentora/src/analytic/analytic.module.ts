import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Property, PropertyAnalytic, PropertyViews } from '@app/common-rentora';

import { AnalyticService } from './analytic.service';

import { AnalyticController } from './analytic.controller';

import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyViews, PropertyAnalytic]),

    SubscriptionModule,
  ],

  controllers: [AnalyticController],

  providers: [AnalyticService],

  exports: [AnalyticService],
})
export class AnalyticModule {}
