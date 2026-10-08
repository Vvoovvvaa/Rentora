import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminsAgencyService } from './admins-agency.service';
import { AdminAuthGuard } from '@app/common-rentora';

@Controller('admins-agency')
@UseGuards(AdminAuthGuard)
export class AdminsAgencyController {
  constructor(private readonly adminsAgencyservice: AdminsAgencyService) {}

  @Post('confirm/:id')
  confirmAgencyVerify(@Param('id', ParseIntPipe) agencyId: number) {
    return this.adminsAgencyservice.confirmVerifyAgency(agencyId);
  }
}
