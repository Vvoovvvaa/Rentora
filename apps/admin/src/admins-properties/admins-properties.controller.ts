import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminsPropertiesService } from './admins-properties.service';
import { AdminAuthGuard } from '@app/common-rentora/guard';
import { AuthUser } from '@app/common-rentora/decorators';
import { deleteUserPropertyDto } from './dto/delete-user-property.dto';

@Controller('admins-properties')
@UseGuards(AdminAuthGuard)
export class AdminsPropertiesController {
  constructor(private readonly adminspropservice: AdminsPropertiesService) { }

  @Get('active')
  viewActiveproperties() {
    return this.adminspropservice.viewActiveProperties();
  }

  @Get('rejected')
  viewRejectedproperties() {
    return this.adminspropservice.viewRejectedProperties();
  }

  @Get('expired')
  viewExpiredproperties() {
    return this.adminspropservice.viewExpiredProperties();
  }

  @Post(':id')
  viewOneProperty(
    @Param('id') propertyID: number,
    @AuthUser('id') adminId: number,
  ) {
    return this.adminspropservice.viewOneProperty(propertyID, adminId);
  }

  @Post('accept/:id')
  acceptPropety(@Param('id') propId: number, @AuthUser('id') adminId: number) {
    return this.adminspropservice.acceptPropertyListing(propId, adminId);
  }

  @Get('pending')
  viewPendnigPorperty() {
    return this.adminspropservice.viewPropertyListing();
  }

  @Post('reject/:id')
  rejectProperty(
    @Param('id') paramId: number,
    @AuthUser('id') adminId: number,
  ) {
    return this.adminspropservice.rejectPropertyListing(paramId, adminId);
  }

  @Post('archive/:id')
  archiveProperty(
    @Param('id') propId: number,
    @AuthUser('id') adminId: number,
  ) {
    return this.adminspropservice.achiveProperty(propId, adminId);
  }

  @Post('resotre/:id')
  resotreProperty(
    @Param('id') propId: number,
    @AuthUser('id') adminId: number,
  ) {
    return this.adminspropservice.restoreProperty(propId, adminId);
  }

  @Delete('delete/:id')
  deleteProperty(@Param('id') propId: number, @AuthUser('id') adminId: number, @Body() body: deleteUserPropertyDto) {
    return this.adminspropservice.deleteProperty(propId, adminId, body);
  }
}
