import { SubscripptionPlanEnum } from '@app/common-rentora';
import { IsEnum } from 'class-validator';

export class ChangeUserPlanDto {
  @IsEnum(SubscripptionPlanEnum)
  plan: SubscripptionPlanEnum;
}
