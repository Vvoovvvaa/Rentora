import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DataSource,
  In,
  IsNull,
  LessThanOrEqual,
} from 'typeorm';

import { Property } from '@app/common-rentora/database/entity';

@Injectable()
export class BoopsExpirationService {
  private readonly logger = new Logger(
    BoopsExpirationService.name,
  );

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireBoops(): Promise<void> {
    try {
      const propertyRepository =
        this.dataSource.getRepository(Property);

      const now = new Date();

      const propertiesToExpire =
        await propertyRepository.find({
          where: [
            {
              boops: true,
              boopsExpiredAt: LessThanOrEqual(now),
            },
            {
              boops: true,
              boopsExpiredAt: IsNull(),
            },
          ],
          select: {
            id: true,
            boopsExpiredAt: true,
          },
        });

      if (propertiesToExpire.length === 0) {
        return;
      }

      const propertyIds = propertiesToExpire.map(
        (property) => property.id,
      );

      const result = await propertyRepository.update(
        {
          id: In(propertyIds),
          boops: true,
        },
        {
          boops: false,
          boopsExpiredAt: null,
        },
      );

      this.logger.log(
        `Expired Boops for ${result.affected ?? 0} properties`,
      );

      this.logger.log(
        `Processed property IDs: ${propertyIds.join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to expire Boops',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }
}