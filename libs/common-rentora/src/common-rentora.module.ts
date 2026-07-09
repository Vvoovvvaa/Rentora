import { Module } from '@nestjs/common';
import { CommonRentoraService } from './common-rentora.service';

@Module({
  providers: [CommonRentoraService],
  exports: [CommonRentoraService],
})
export class CommonRentoraModule {}
