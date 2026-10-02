import {
  Property,
  PropertyAnalytic,
  PropertyViews,
} from '@app/common-rentora';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class AnalyticService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,

    @InjectRepository(PropertyViews)
    private readonly propertyViewsRepo: Repository<PropertyViews>,

    @InjectRepository(PropertyAnalytic)
    private readonly propertyAnalyticRepo: Repository<PropertyAnalytic>,

    private readonly subscriptionService: SubscriptionService,
  ) {}

  // =====================================================
  // ACCESS
  // =====================================================

  private async checkAnalyticsAccess(
    userId: number,
    propertyId: number,
  ): Promise<void> {
    /*
     * Проверяем одновременно:
     * - property существует
     * - property принадлежит этому пользователю
     */
    const property = await this.propertyRepo.findOne({
      where: {
        id: propertyId,

        owner: {
          id: userId,
        },
      },

      select: {
        id: true,
      },
    });

    /*
     * Не раскрываем пользователю информацию
     * о существовании чужого property.
     */
    if (!property) {
      throw new NotFoundException(
        'Property not found',
      );
    }

    /*
     * SubscriptionService сам определяет:
     *
     * UserSubscription
     *      ↓
     * FREE / PLUS / PRO
     *      ↓
     * SubscriptionConfig
     */
    const config =
      await this.subscriptionService.getUserConfig(
        userId,
      );

    if (!config.advancedAnalytics) {
      throw new ForbiddenException(
        'Advanced analytics is available only for PLUS and PRO plans',
      );
    }
  }

  // =====================================================
  // DATE HELPERS
  // =====================================================

  private formatDate(
    date: Date,
  ): string {
    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1,
      ).padStart(
        2,
        '0',
      );

    const day =
      String(
        date.getDate(),
      ).padStart(
        2,
        '0',
      );

    return `${year}-${month}-${day}`;
  }

  private getToday(): string {
    return this.formatDate(
      new Date(),
    );
  }

  // =====================================================
  // DAILY ANALYTIC
  // =====================================================

  private async createTodayAnalytic(
    propertyId: number,
  ) {
    const property =
      await this.propertyRepo.findOne({
        where: {
          id: propertyId,
        },
      });

    if (!property) {
      throw new BadRequestException(
        'Property not found',
      );
    }

    const today =
      this.getToday();

    let analytic =
      await this.propertyAnalyticRepo.findOne({
        where: {
          property: {
            id: propertyId,
          },

          date: today,
        },
      });

    if (!analytic) {
      analytic =
        this.propertyAnalyticRepo.create({
          property,

          date: today,

          favoritesAdded: 0,

          chatsStarted: 0,
        });

      await this.propertyAnalyticRepo.save(
        analytic,
      );
    }

    return analytic;
  }

  // =====================================================
  // FAVORITE
  // =====================================================

  async addFavorite(
    propertyId: number,
  ): Promise<void> {
    const analytic =
      await this.createTodayAnalytic(
        propertyId,
      );

    await this.propertyAnalyticRepo.increment(
      {
        id: analytic.id,
      },

      'favoritesAdded',

      1,
    );
  }

  // =====================================================
  // CHAT
  // =====================================================

  async addChat(
    propertyId: number,
  ): Promise<void> {
    const analytic =
      await this.createTodayAnalytic(
        propertyId,
      );

    await this.propertyAnalyticRepo.increment(
      {
        id: analytic.id,
      },

      'chatsStarted',

      1,
    );
  }

  // =====================================================
  // VIEWS
  // =====================================================

  private async getViews(
    propertyId: number,
  ) {
    const property =
      await this.propertyRepo.findOne({
        where: {
          id: propertyId,
        },
      });

    if (!property) {
      throw new BadRequestException(
        'Property not found',
      );
    }

    const now =
      new Date();

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

    const week =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6,
      );

    const month =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 29,
      );

    const [
      todayViews,
      weekViews,
      monthViews,
    ] = await Promise.all([
      this.propertyViewsRepo.count({
        where: {
          property: {
            id: propertyId,
          },

          createdAt:
            MoreThanOrEqual(
              today,
            ),
        },
      }),

      this.propertyViewsRepo.count({
        where: {
          property: {
            id: propertyId,
          },

          createdAt:
            MoreThanOrEqual(
              week,
            ),
        },
      }),

      this.propertyViewsRepo.count({
        where: {
          property: {
            id: propertyId,
          },

          createdAt:
            MoreThanOrEqual(
              month,
            ),
        },
      }),
    ]);

    return {
      today: todayViews,

      week: weekViews,

      month: monthViews,

      total:
        property.view ?? 0,
    };
  }

  // =====================================================
  // VIEWS CHART
  // =====================================================

  private async getViewsChart(
    propertyId: number,
    days: number = 7,
  ) {
    if (
      days < 1 ||
      days > 365
    ) {
      throw new BadRequestException(
        'Days must be between 1 and 365',
      );
    }

    const property =
      await this.propertyRepo.findOne({
        where: {
          id: propertyId,
        },

        select: {
          id: true,
        },
      });

    if (!property) {
      throw new BadRequestException(
        'Property not found',
      );
    }

    const fromDate =
      new Date();

    fromDate.setHours(
      0,
      0,
      0,
      0,
    );

    fromDate.setDate(
      fromDate.getDate() -
        (days - 1),
    );

    const views =
      await this.propertyViewsRepo
        .createQueryBuilder(
          'view',
        )

        .innerJoin(
          'view.property',
          'property',
        )

        .select(
          'DATE(view.createdAt)',
          'date',
        )

        .addSelect(
          'COUNT(view.id)',
          'views',
        )

        .where(
          'property.id = :propertyId',
          {
            propertyId,
          },
        )

        .andWhere(
          'view.createdAt >= :fromDate',
          {
            fromDate,
          },
        )

        .groupBy(
          'DATE(view.createdAt)',
        )

        .orderBy(
          'DATE(view.createdAt)',
          'ASC',
        )

        .getRawMany<{
          date: string;
          views: string;
        }>();

    const viewsMap =
      new Map<
        string,
        number
      >();

    for (
      const view of views
    ) {
      viewsMap.set(
        String(view.date),
        Number(view.views),
      );
    }

    const chart: {
      date: string;
      views: number;
    }[] = [];

    for (
      let i = 0;
      i < days;
      i++
    ) {
      const date =
        new Date(fromDate);

      date.setDate(
        fromDate.getDate() + i,
      );

      const formattedDate =
        this.formatDate(
          date,
        );

      chart.push({
        date:
          formattedDate,

        views:
          viewsMap.get(
            formattedDate,
          ) ?? 0,
      });
    }

    return chart;
  }

  // =====================================================
  // ANALYTIC PERIOD
  // =====================================================

  private async getAnalyticPeriod(
    propertyId: number,
    fromDate?: string,
  ) {
    const query =
      this.propertyAnalyticRepo
        .createQueryBuilder(
          'analytic',
        )

        .innerJoin(
          'analytic.property',
          'property',
        )

        .select(
          'COALESCE(SUM(analytic.favoritesAdded), 0)',
          'favorites',
        )

        .addSelect(
          'COALESCE(SUM(analytic.chatsStarted), 0)',
          'chats',
        )

        .where(
          'property.id = :propertyId',
          {
            propertyId,
          },
        );

    if (fromDate) {
      query.andWhere(
        'analytic.date >= :fromDate',
        {
          fromDate,
        },
      );
    }

    const result =
      await query.getRawOne<{
        favorites: string;
        chats: string;
      }>();

    return {
      favorites:
        Number(
          result?.favorites ??
            0,
        ),

      chats:
        Number(
          result?.chats ??
            0,
        ),
    };
  }

  // =====================================================
  // ACTIVITIES
  // =====================================================

  private async getActivities(
    propertyId: number,
  ) {
    const property =
      await this.propertyRepo.findOne({
        where: {
          id: propertyId,
        },

        select: {
          id: true,
        },
      });

    if (!property) {
      throw new BadRequestException(
        'Property not found',
      );
    }

    const now =
      new Date();

    const today =
      this.getToday();

    const week =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6,
      );

    const month =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 29,
      );

    const weekDate =
      this.formatDate(
        week,
      );

    const monthDate =
      this.formatDate(
        month,
      );

    const [
      todayStats,
      weekStats,
      monthStats,
      totalStats,
    ] = await Promise.all([
      this.getAnalyticPeriod(
        propertyId,
        today,
      ),

      this.getAnalyticPeriod(
        propertyId,
        weekDate,
      ),

      this.getAnalyticPeriod(
        propertyId,
        monthDate,
      ),

      this.getAnalyticPeriod(
        propertyId,
      ),
    ]);

    return {
      today:
        todayStats,

      week:
        weekStats,

      month:
        monthStats,

      total:
        totalStats,
    };
  }

  // =====================================================
  // CONVERSION
  // =====================================================

  private calculateRate(
    value: number,
    views: number,
  ): number {
    if (!views) {
      return 0;
    }

    return Number(
      (
        (value / views) *
        100
      ).toFixed(2),
    );
  }

  // =====================================================
  // MAIN ANALYTICS
  // =====================================================

  async getPropertyAnalytics(
    propertyId: number,
    userId: number,
  ) {
    /*
     * ВАЖНО:
     *
     * userId первым,
     * propertyId вторым.
     */
    await this.checkAnalyticsAccess(
      userId,
      propertyId,
    );

    const [
      views,
      activities,
      chart,
    ] = await Promise.all([
      this.getViews(
        propertyId,
      ),

      this.getActivities(
        propertyId,
      ),

      this.getViewsChart(
        propertyId,
        7,
      ),
    ]);

    return {
      views,

      favorites: {
        today:
          activities.today
            .favorites,

        week:
          activities.week
            .favorites,

        month:
          activities.month
            .favorites,

        total:
          activities.total
            .favorites,
      },

      chats: {
        today:
          activities.today
            .chats,

        week:
          activities.week
            .chats,

        month:
          activities.month
            .chats,

        total:
          activities.total
            .chats,
      },

      conversion: {
        today: {
          favorite:
            this.calculateRate(
              activities.today
                .favorites,

              views.today,
            ),

          chat:
            this.calculateRate(
              activities.today
                .chats,

              views.today,
            ),
        },

        week: {
          favorite:
            this.calculateRate(
              activities.week
                .favorites,

              views.week,
            ),

          chat:
            this.calculateRate(
              activities.week
                .chats,

              views.week,
            ),
        },

        month: {
          favorite:
            this.calculateRate(
              activities.month
                .favorites,

              views.month,
            ),

          chat:
            this.calculateRate(
              activities.month
                .chats,

              views.month,
            ),
        },

        total: {
          favorite:
            this.calculateRate(
              activities.total
                .favorites,

              views.total,
            ),

          chat:
            this.calculateRate(
              activities.total
                .chats,

              views.total,
            ),
        },
      },

      chart,
    };
  }
}