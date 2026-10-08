import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePropertyDto } from './create-property.dto';

export class changePropertyDto extends PartialType(
  OmitType(CreatePropertyDto, ['agencyId'] as const),
) {}
