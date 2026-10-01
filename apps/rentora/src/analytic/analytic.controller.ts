import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { AnalyticService } from './analytic.service';
import { AuthGuard, OwnerCheckGuard } from '@app/common-rentora';

UseGuards(AuthGuard, OwnerCheckGuard)
@Controller('analytic')
export class AnalyticController {
  constructor(
    private readonly analyticService: AnalyticService,
  ) { }

  @Get('property/:propertyId')
  async getPropertyAnalytics(
    @Param('propertyId', ParseIntPipe)
    propertyId: number,
  ) {
    return this.analyticService.getPropertyAnalytics(
      propertyId,
    );
  }
}