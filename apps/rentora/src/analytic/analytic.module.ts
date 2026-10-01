import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  Property,
  PropertyAnalytic,
  PropertyViews,
} from '@app/common-rentora';

import { AnalyticService } from './analytic.service';
import { AnalyticController } from './analytic.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      PropertyViews,
      PropertyAnalytic,
    ]),
  ],

  controllers: [
    AnalyticController,
  ],

  providers: [
    AnalyticService,
  ],

  exports: [
    AnalyticService,
  ],
})
export class AnalyticModule {}