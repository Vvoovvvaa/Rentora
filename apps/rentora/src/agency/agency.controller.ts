import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { AgencyService } from './agency.service';
import { AuthGuard, AuthUser } from '@app/common-rentora';

import { CreateAgencyDto } from './dto/create-agency.dto';
import { ChangeAgencyDto } from './dto/change-agency.dto';

@Controller('agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  createAgency(
    @AuthUser('id') userId: number,
    @Body() body: CreateAgencyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.agencyService.createAgency(body, userId, file);
  }

  @Patch('change')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  changeAgency(
    @AuthUser('id') userId: number,
    @Body() body: ChangeAgencyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.agencyService.changeAgency(body, userId, file);
  }

  @Get('all')
  getAllAgencies() {
    return this.agencyService.getAllAgencies();
  }

  @Get('one/:id')
  getOneAgency(@Param('id', ParseIntPipe) agencyId: number) {
    return this.agencyService.getOneAgency(agencyId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  removeAgency(
    @Param('id', ParseIntPipe) agencyId: number,
    @AuthUser('id') userId: number,
  ) {
    return this.agencyService.deleteAgency(agencyId, userId);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  myAgency(@AuthUser('id') userId: number) {
    return this.agencyService.getMyAgency(userId);
  }
}
