import { SubscripptionPlanEnum } from '@app/common-rentora/enums';
import { Column, Entity, Index } from 'typeorm';
import { Base } from './base';

@Entity('subscription_configs')
export class SubscriptionConfig extends Base {
  @Index({ unique: true })
  @Column({
    type: 'enum',
    enum: SubscripptionPlanEnum,
  })
  plan: SubscripptionPlanEnum;

  @Column({
    name: 'max_properties',
    type: 'int',
  })
  maxProperties: number;

  @Column({
    name: 'advanced_analytics',
    default: false,
  })
  advancedAnalytics: boolean;

  @Column({
    name: 'monthly_bumps',
    type: 'int',
    default: 0,
  })
  monthlyBumps: number;

  @Column({
    name: 'priority_search',
    default: false,
  })
  prioritySearch: boolean;

  @Column({
    type: 'int',
    default: 0,
  })
  price: number;
}