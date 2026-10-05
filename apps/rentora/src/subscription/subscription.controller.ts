import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AuthGuard, AuthUser } from '@app/common-rentora';

import { SubscriptionService } from './subscription.service';
import { ChangeUserPlanDto } from './dto/change-user-plan.dto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // =====================================================
  // AVAILABLE PLANS
  // =====================================================

  @Get('plans')
  getAllPlans() {
    return this.subscriptionService.getAllPlans();
  }

  // =====================================================
  // MY SUBSCRIPTION
  // =====================================================

  @UseGuards(AuthGuard)
  @Get('me')
  getMySubscription(
    @AuthUser('id')
    userId: number,
  ) {
    return this.subscriptionService.getMySubscription(userId);
  }

  // =====================================================
  // TEMPORARY TEST PURCHASE
  //
  // удалить после подключения payment
  // =====================================================

  @UseGuards(AuthGuard)
  @Post('test-purchase')
  testPurchase(
    @AuthUser('id')
    userId: number,

    @Body()
    dto: ChangeUserPlanDto,
  ) {
    return this.subscriptionService.testPurchase(userId, dto.plan);
  }
}
