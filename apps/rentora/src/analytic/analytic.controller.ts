import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import {
  AuthGuard,
  AuthUser,
} from '@app/common-rentora';

import { AnalyticService } from './analytic.service';

@Controller('analytic')
@UseGuards(AuthGuard)
export class AnalyticController {
  constructor(
    private readonly analyticService:
      AnalyticService,
  ) {}

  @Get('property/:propertyId')
  async getPropertyAnalytics(
    @Param(
      'propertyId',
      ParseIntPipe,
    )
    propertyId: number,

    @AuthUser('id')
    userId: number,
  ) {
    return this.analyticService
      .getPropertyAnalytics(
        propertyId,
        userId,
      );
  }
}