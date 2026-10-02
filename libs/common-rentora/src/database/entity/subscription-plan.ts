import { SubscripptionPlanEnum, SubscriptionStatusEnum } from "@app/common-rentora/enums";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./user";
import { Base } from "./base";

@Entity('user_subscriptions')
export class UserSubscription extends Base {
  @Column({
    type: 'enum',
    enum: SubscripptionPlanEnum,
    default: SubscripptionPlanEnum.FREE,
  })
  plan: SubscripptionPlanEnum;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusEnum,
    default: SubscriptionStatusEnum.ACTIVE,
  })
  status: SubscriptionStatusEnum;

  @Column({
    name: 'auto_renew',
    default: false,
  })
  autoRenew: boolean;

  @Column({
    name: 'started_at',
    type: 'timestamp',
    nullable: true,
  })
  startedAt: Date | null;

  @Column({
    name: 'expires_at',
    type: 'timestamp',
    nullable: true,
  })
  expiresAt: Date | null;

  @ManyToOne(
    () => User,
    user => user.subscriptions,
    {
      onDelete: 'CASCADE',
    },
  )
  user: User;
}