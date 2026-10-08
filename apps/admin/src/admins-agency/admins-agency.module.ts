import { Agency, AgencyImage } from '@app/common-rentora';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsAgencyService } from './admins-agency.service';
import { AdminsAgencyController } from './admins-agency.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Agency, AgencyImage])],
  providers: [AdminsAgencyService],
  controllers: [AdminsAgencyController],
})
export class AdminsAgencyModule {}
