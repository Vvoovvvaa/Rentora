import {
  Property,
  PropertyPublishing,
  PropertyStatus,
} from '@app/common-rentora';

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThanOrEqual } from 'typeorm';

@Injectable()
export class ListingExpirationserivce {
  private readonly logger = new Logger(
    ListingExpirationserivce.name,
  );

  private readonly expirationDays = 31;

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Yerevan',
    waitForCompletion: true,
  })
  async expireListing(): Promise<void> {
    const now = new Date();

    const expirationDate = new Date(
      now.getTime() -
        this.expirationDays * 24 * 60 * 60 * 1000,
    );

    try {
      const propertyRepo =
        this.dataSource.getRepository(Property);

      const result = await propertyRepo.update(
        {
          status: PropertyStatus.ACTIVE,
          publishing: PropertyPublishing.ACTIVE,
          createdAt: LessThanOrEqual(expirationDate),
        },
        {
          status: PropertyStatus.EXPIRED,
          boops: false,
          boopsExpiredAt: null,
        },
      );

      this.logger.log(
        `Expired listings: ${result.affected ?? 0}`,
      );

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `Expired ${result.affected} properties older than ${this.expirationDays} days`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to expire properties',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }
}