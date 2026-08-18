import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { AuthUser } from '@app/common-rentora/decorators';
import { AuthGuard } from '@app/common-rentora/guard';

@Controller('support')
@UseGuards(AuthGuard)
export class SupportController {
  constructor(private readonly supportservice: SupportService) {}

  @Post('create')
  createSupport(
    @Body() body: CreateSupportDto,
    @AuthUser('id') userId: number,
  ) {
    return this.supportservice.createSupport(body, userId);
  }

  @Get()
  viewMysupports(@AuthUser('id') userId: number) {
    return this.supportservice.viewMySupports(userId);
  }

  @Get(':id')
  viewOnesupport(
    @AuthUser('id') userId: number,
    @Param('id') supportId: number,
  ) {
    return this.supportservice.viewOneSupport(userId, supportId);
  }

  @Post(':id')
  removesupport(
    @AuthUser('id') userId: number,
    @Param('id') supportId: number,
  ) {
    return this.supportservice.removeSupport(userId, supportId);
  }
}
