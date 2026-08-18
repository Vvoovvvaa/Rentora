import { Admin, Support } from '@app/common-rentora/database/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportAdminController } from './support.controller';
import { SupportAdminservice } from './support.service';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, Support])],
  controllers: [SupportAdminController],
  providers: [SupportAdminservice],
})
export class SupportAdminModule {}
