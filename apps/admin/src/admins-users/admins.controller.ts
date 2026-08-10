import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminAuthGuard } from '@app/common-rentora/guard';
import { AuthUser } from '@app/common-rentora/decorators';

@Controller('admins')
@UseGuards(AdminAuthGuard)
export class AdminsController {
    constructor(private readonly adminservice: AdminsService) { }

    @Get('users')
    viewUsers() {
        return this.adminservice.viewUsers()
    }

    @Post('block/:id')
    blockUser(@AuthUser('id') adminId: number, @Param('id') userId: number) {
        return this.adminservice.blockUser(userId, adminId)
    }
}
