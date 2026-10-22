import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  AdminAuthGuard,
} from '@app/common-rentora';

import { AdminsAgencyService } from './admins-agency.service';
import { RejectAgencyDto } from './dto/agency-reject.dto';
import { deleteagencyDto } from './dto/delete-agency.dto';

@Controller('admins-agency')
@UseGuards(AdminAuthGuard)
export class AdminsAgencyController {
  constructor(
    private readonly adminsAgencyService: AdminsAgencyService,
  ) {}

  @Get('pending')
  getPendingAgencies() {
    return this.adminsAgencyService.getAllPendingAgency();
  }

  @Post('confirm/:id')
  confirmAgencyVerify(
    @Param('id', ParseIntPipe) agencyId: number,
  ) {
    return this.adminsAgencyService.confirmVerifyAgency(
      agencyId,
    );
  }

  @Post('reject/:id')
  rejectAgencyVerify(
    @Param('id', ParseIntPipe) agencyId: number,
    @Body() body: RejectAgencyDto,
  ) {
    return this.adminsAgencyService.RejectAgencyVerify(
      agencyId,
      body,
    );
  }

  @Get('confirms')
  getConfirmedAgency() {
    return this.adminsAgencyService.getAllVerfiedAgency();
  }

  @Get('rejects')
  getAllRejectedAgency() {
    return this.adminsAgencyService.getAllRejectedAgency();
  }

  @Delete(':id')
  deleteAgency(
    @Param('id', ParseIntPipe) agencyId: number,
    @Body() body: deleteagencyDto,
  ) {
    return this.adminsAgencyService.deleteAgency(
      agencyId,
      body,
    );
  }
}