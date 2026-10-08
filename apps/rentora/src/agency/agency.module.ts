import { Agency, AgencyImage } from '@app/common-rentora';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agency, AgencyImage]), UploadModule],
  controllers: [AgencyController],
  providers: [AgencyService],
})
export class AgencyModule {}
