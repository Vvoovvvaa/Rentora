import {
  SubscripptionPlanEnum,
  SubscriptionStatusEnum,
  User,
} from '@app/common-rentora';

import { SubscriptionConfig } from '@app/common-rentora/database/entity/subscription-config';
import { UserSubscription } from '@app/common-rentora/database/entity/subscription-plan';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, MoreThan, Repository } from 'typeorm';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepo: Repository<UserSubscription>,

    @InjectRepository(SubscriptionConfig)
    private readonly subscriptionConfigRepo: Repository<SubscriptionConfig>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  async getUserPlan(userId: number): Promise<SubscripptionPlanEnum> {
    const subscription = await this.userSubscriptionRepo.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatusEnum.ACTIVE,
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return subscription?.plan ?? SubscripptionPlanEnum.FREE;
  }

  async getAllPlans() {
    return this.subscriptionConfigRepo.find({
      order: {
        price: 'ASC',
      },
    });
  }

  async getPlanConfig(
    plan: SubscripptionPlanEnum,
  ): Promise<SubscriptionConfig> {
    const config = await this.subscriptionConfigRepo.findOne({
      where: { plan },
    });

    if (!config) {
      throw new InternalServerErrorException(
        `Subscription config for ${plan} not found`,
      );
    }

    return config;
  }

  async getUserConfig(userId: number): Promise<SubscriptionConfig> {
    const plan = await this.getUserPlan(userId);

    return this.getPlanConfig(plan);
  }

  async getMySubscription(userId: number) {
    const subscription = await this.userSubscriptionRepo.findOne({
      where: {
        user: { id: userId },
        status: SubscriptionStatusEnum.ACTIVE,
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!subscription) {
      const config = await this.getPlanConfig(
        SubscripptionPlanEnum.FREE,
      );

      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: {
          id: true,
          boopsCount: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        plan: SubscripptionPlanEnum.FREE,
        status: SubscriptionStatusEnum.ACTIVE,
        autoRenew: false,
        startedAt: null,
        expiresAt: null,
        boopsCount: user.boopsCount ?? 0,
        config,
      };
    }

    const [config, user] = await Promise.all([
      this.getPlanConfig(subscription.plan),

      this.userRepo.findOne({
        where: { id: userId },
        select: {
          id: true,
          boopsCount: true,
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      autoRenew: subscription.autoRenew,
      startedAt: subscription.startedAt,
      expiresAt: subscription.expiresAt,
      boopsCount: user.boopsCount ?? 0,
      config,
    };
  }

  async testPurchase(
    userId: number,
    plan: SubscripptionPlanEnum,
  ) {
    if (plan === SubscripptionPlanEnum.FREE) {
      throw new BadRequestException(
        'FREE plan cannot be purchased',
      );
    }

    // Check that the selected plan exists.
    const config = await this.getPlanConfig(plan);

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const subscriptionRepo =
        manager.getRepository(UserSubscription);

      // Lock the user row to protect the boops balance.
      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Find the existing active subscription.
      const currentSubscription =
        await subscriptionRepo.findOne({
          where: {
            user: { id: userId },
            status: SubscriptionStatusEnum.ACTIVE,
          },
          order: {
            createdAt: 'DESC',
          },
        });

      // Cancel the previous subscription.
      if (currentSubscription) {
        currentSubscription.status =
          SubscriptionStatusEnum.CANCELED;

        currentSubscription.autoRenew = false;

        await subscriptionRepo.save(currentSubscription);
      }

      // Test subscription duration: 30 days.
      const startedAt = new Date();
      const expiresAt = new Date(startedAt);

      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create the new subscription.
      const subscription = subscriptionRepo.create({
        user,
        plan,
        status: SubscriptionStatusEnum.ACTIVE,
        autoRenew: false,
        startedAt,
        expiresAt,
      });

      const saved = await subscriptionRepo.save(subscription);

      // =====================================================
      // GRANT BOOPS FROM THE SUBSCRIPTION PLAN
      // =====================================================

      const grantedBumps = Math.max(
        0,
        config.monthlyBumps ?? 0,
      );

      // Add the plan's bumps to the user's current balance.
      user.boopsCount =
        (user.boopsCount ?? 0) + grantedBumps;

      await userRepo.save(user);

      // Subscription and boops are committed together.
      return {
        message: 'Test subscription activated',

        subscription: {
          id: saved.id,
          plan: saved.plan,
          status: saved.status,
          startedAt: saved.startedAt,
          expiresAt: saved.expiresAt,
        },

        config: {
          price: config.price,
          maxProperties: config.maxProperties,
          advancedAnalytics: config.advancedAnalytics,
          monthlyBumps: config.monthlyBumps,
          prioritySearch: config.prioritySearch,
        },

        boops: {
          granted: grantedBumps,
          balance: user.boopsCount,
        },
      };
    });
  }
}