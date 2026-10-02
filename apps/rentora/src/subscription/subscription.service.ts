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

import {
  DataSource,
  MoreThan,
  Repository,
} from 'typeorm';

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

  // =====================================================
  // CURRENT USER PLAN
  // =====================================================

  async getUserPlan(
    userId: number,
  ): Promise<SubscripptionPlanEnum> {
    const subscription =
      await this.userSubscriptionRepo.findOne({
        where: {
          user: {
            id: userId,
          },

          status:
            SubscriptionStatusEnum.ACTIVE,

          expiresAt: MoreThan(new Date()),
        },

        order: {
          createdAt: 'DESC',
        },
      });

    return (
      subscription?.plan ??
      SubscripptionPlanEnum.FREE
    );
  }

  // =====================================================
  // ALL PLANS
  // =====================================================

  async getAllPlans() {
    return this.subscriptionConfigRepo.find({
      order: {
        price: 'ASC',
      },
    });
  }

  // =====================================================
  // PLAN CONFIG
  // =====================================================

  async getPlanConfig(
    plan: SubscripptionPlanEnum,
  ): Promise<SubscriptionConfig> {
    const config =
      await this.subscriptionConfigRepo.findOne({
        where: {
          plan,
        },
      });

    if (!config) {
      throw new InternalServerErrorException(
        `Subscription config for ${plan} not found`,
      );
    }

    return config;
  }

  // =====================================================
  // USER CONFIG
  // =====================================================

  async getUserConfig(
    userId: number,
  ): Promise<SubscriptionConfig> {
    const plan =
      await this.getUserPlan(userId);

    return this.getPlanConfig(plan);
  }

  // =====================================================
  // MY SUBSCRIPTION
  // =====================================================

  async getMySubscription(
    userId: number,
  ) {
    const subscription =
      await this.userSubscriptionRepo.findOne({
        where: {
          user: {
            id: userId,
          },

          status:
            SubscriptionStatusEnum.ACTIVE,

          expiresAt: MoreThan(new Date()),
        },

        order: {
          createdAt: 'DESC',
        },
      });

    if (!subscription) {
      const config =
        await this.getPlanConfig(
          SubscripptionPlanEnum.FREE,
        );

      return {
        plan:
          SubscripptionPlanEnum.FREE,

        status:
          SubscriptionStatusEnum.ACTIVE,

        autoRenew: false,

        startedAt: null,
        expiresAt: null,

        config,
      };
    }

    const config =
      await this.getPlanConfig(
        subscription.plan,
      );

    return {
      id: subscription.id,

      plan: subscription.plan,

      status: subscription.status,

      autoRenew:
        subscription.autoRenew,

      startedAt:
        subscription.startedAt,

      expiresAt:
        subscription.expiresAt,

      config,
    };
  }

  // =====================================================
  // TEMPORARY TEST PURCHASE
  //
  // УДАЛИТЬ после подключения настоящей оплаты
  // =====================================================

  async testPurchase(
    userId: number,
    plan: SubscripptionPlanEnum,
  ) {
    if (
      plan === SubscripptionPlanEnum.FREE
    ) {
      throw new BadRequestException(
        'FREE plan cannot be purchased',
      );
    }

    const user =
      await this.userRepo.findOne({
        where: {
          id: userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    // Проверяем, что такой тариф реально существует
    const config =
      await this.getPlanConfig(plan);

    return this.dataSource.transaction(
      async manager => {
        const subscriptionRepo =
          manager.getRepository(
            UserSubscription,
          );

        const currentSubscription =
          await subscriptionRepo.findOne({
            where: {
              user: {
                id: userId,
              },

              status:
                SubscriptionStatusEnum.ACTIVE,
            },

            order: {
              createdAt: 'DESC',
            },
          });

        /*
         * Если старая подписка ещё помечена ACTIVE,
         * закрываем её.
         *
         * Позже при настоящих платежах здесь будет
         * отдельная логика upgrade/downgrade.
         */
        if (currentSubscription) {
          currentSubscription.status =
            SubscriptionStatusEnum.CANCELED;

          currentSubscription.autoRenew =
            false;

          await subscriptionRepo.save(
            currentSubscription,
          );
        }

        const startedAt = new Date();

        /*
         * Пока тестируем месячную подписку
         * как 30 дней.
         *
         * Позже expiresAt будет определяться
         * уже логикой настоящей оплаты.
         */
        const expiresAt =
          new Date(startedAt);

        expiresAt.setDate(
          expiresAt.getDate() + 30,
        );

        const subscription =
          subscriptionRepo.create({
            user,

            plan,

            status:
              SubscriptionStatusEnum.ACTIVE,

            autoRenew: false,

            startedAt,

            expiresAt,
          });

        const saved =
          await subscriptionRepo.save(
            subscription,
          );

        return {
          message:
            'Test subscription activated',

          subscription: {
            id: saved.id,
            plan: saved.plan,
            status: saved.status,
            startedAt:
              saved.startedAt,
            expiresAt:
              saved.expiresAt,
          },

          config: {
            price: config.price,

            maxProperties:
              config.maxProperties,

            advancedAnalytics:
              config.advancedAnalytics,

            monthlyBumps:
              config.monthlyBumps,

            prioritySearch:
              config.prioritySearch,
          },
        };
      },
    );
  }
}