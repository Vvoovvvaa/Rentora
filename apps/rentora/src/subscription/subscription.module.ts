import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { UserSubscription } from '@app/common-rentora/database/entity/subscription-plan';
import { SubscriptionConfig } from '@app/common-rentora/database/entity/subscription-config';
import { User } from '@app/common-rentora';

@Module({
    imports: [TypeOrmModule.forFeature([UserSubscription, SubscriptionConfig,User])],
    controllers: [SubscriptionController],
    providers: [SubscriptionService],
    exports: [SubscriptionService]
})
export class SubscriptionModule {}
