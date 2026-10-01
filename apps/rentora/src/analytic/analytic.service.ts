import {
  Property,
  PropertyAnalytic,
  PropertyViews,
} from '@app/common-rentora';

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

@Injectable()
export class AnalyticService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,

    @InjectRepository(PropertyViews)
    private readonly propertyViewsRepo: Repository<PropertyViews>,

    @InjectRepository(PropertyAnalytic)
    private readonly propertyAnalyticRepo: Repository<PropertyAnalytic>,
  ) {}

  private formatDate(date: Date) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, '0');

    const day = String(
      date.getDate(),
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getToday() {
    return this.formatDate(new Date());
  }

  async createTodayAnalytic(propertyId: number) {
    const property = await this.propertyRepo.findOne({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new BadRequestException('Property Not found');
    }

    const today = this.getToday();

    let analytic = await this.propertyAnalyticRepo.findOne({
      where: {
        property: {
          id: propertyId,
        },
        date: today,
      },
    });

    if (!analytic) {
      analytic = this.propertyAnalyticRepo.create({
        property: property,
        date: today,
        favoritesAdded: 0,
        chatsStarted: 0,
      });

      await this.propertyAnalyticRepo.save(analytic);
    }

    return analytic;
  }

  async addFavorite(propertyId: number) {
    const analytic = await this.createTodayAnalytic(propertyId);

    await this.propertyAnalyticRepo.increment(
      {
        id: analytic.id,
      },
      'favoritesAdded',
      1,
    );
  }

  async addChat(propertyId: number) {
    const analytic = await this.createTodayAnalytic(propertyId);

    await this.propertyAnalyticRepo.increment(
      {
        id: analytic.id,
      },
      'chatsStarted',
      1,
    );
  }

  async getViews(propertyId: number) {
    const property = await this.propertyRepo.findOne({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new BadRequestException('Property Not found');
    }

    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const week = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
    );

    const month = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 29,
    );

    const todayViews = await this.propertyViewsRepo.count({
      where: {
        property: {
          id: propertyId,
        },
        createdAt: MoreThanOrEqual(today),
      },
    });

    const weekViews = await this.propertyViewsRepo.count({
      where: {
        property: {
          id: propertyId,
        },
        createdAt: MoreThanOrEqual(week),
      },
    });

    const monthViews = await this.propertyViewsRepo.count({
      where: {
        property: {
          id: propertyId,
        },
        createdAt: MoreThanOrEqual(month),
      },
    });

    return {
      today: todayViews,
      week: weekViews,
      month: monthViews,
      total: property.view,
    };
  }

  async getViewsChart(
    propertyId: number,
    days: number = 7,
  ) {
    const property = await this.propertyRepo.findOne({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new BadRequestException('Property Not found');
    }

    const fromDate = new Date();

    fromDate.setHours(0, 0, 0, 0);

    fromDate.setDate(
      fromDate.getDate() - (days - 1),
    );

    const views = await this.propertyViewsRepo
      .createQueryBuilder('view')
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

    const viewsMap = new Map<string, number>();

    for (const view of views) {
      viewsMap.set(
        view.date,
        Number(view.views),
      );
    }

    const chart: {
      date: string;
      views: number;
    }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(fromDate);

      date.setDate(
        fromDate.getDate() + i,
      );

      const formattedDate = this.formatDate(date);

      chart.push({
        date: formattedDate,
        views: viewsMap.get(formattedDate) ?? 0,
      });
    }

    return chart;
  }

  private async getAnalyticPeriod(
    propertyId: number,
    fromDate?: string,
  ) {
    const query = this.propertyAnalyticRepo
      .createQueryBuilder('analytic')
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

    const result = await query.getRawOne();

    return {
      favorites: Number(
        result?.favorites ?? 0,
      ),
      chats: Number(
        result?.chats ?? 0,
      ),
    };
  }

  async getActivities(propertyId: number) {
    const property = await this.propertyRepo.findOne({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      throw new BadRequestException('Property Not found');
    }

    const now = new Date();

    const today = this.getToday();

    const week = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
    );

    const month = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 29,
    );

    const weekDate = this.formatDate(week);
    const monthDate = this.formatDate(month);

    const todayStats = await this.getAnalyticPeriod(
      propertyId,
      today,
    );

    const weekStats = await this.getAnalyticPeriod(
      propertyId,
      weekDate,
    );

    const monthStats = await this.getAnalyticPeriod(
      propertyId,
      monthDate,
    );

    const totalStats = await this.getAnalyticPeriod(
      propertyId,
    );

    return {
      today: todayStats,
      week: weekStats,
      month: monthStats,
      total: totalStats,
    };
  }

  private calculateRate(
    value: number,
    views: number,
  ) {
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

  async getPropertyAnalytics(propertyId: number) {
    const views = await this.getViews(propertyId);

    const activities = await this.getActivities(propertyId);

    const chart = await this.getViewsChart(
      propertyId,
      7,
    );

    return {
      views,

      favorites: {
        today: activities.today.favorites,
        week: activities.week.favorites,
        month: activities.month.favorites,
        total: activities.total.favorites,
      },

      chats: {
        today: activities.today.chats,
        week: activities.week.chats,
        month: activities.month.chats,
        total: activities.total.chats,
      },

      conversion: {
        today: {
          favorite: this.calculateRate(
            activities.today.favorites,
            views.today,
          ),

          chat: this.calculateRate(
            activities.today.chats,
            views.today,
          ),
        },

        week: {
          favorite: this.calculateRate(
            activities.week.favorites,
            views.week,
          ),

          chat: this.calculateRate(
            activities.week.chats,
            views.week,
          ),
        },

        month: {
          favorite: this.calculateRate(
            activities.month.favorites,
            views.month,
          ),

          chat: this.calculateRate(
            activities.month.chats,
            views.month,
          ),
        },

        total: {
          favorite: this.calculateRate(
            activities.total.favorites,
            views.total,
          ),

          chat: this.calculateRate(
            activities.total.chats,
            views.total,
          ),
        },
      },

      chart,
    };
  }
}