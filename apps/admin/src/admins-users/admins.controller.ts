import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminAuthGuard } from '@app/common-rentora/guard';
import { AuthUser } from '@app/common-rentora/decorators';
import { findUserDto } from './dto/user-find.dto';

@Controller('admins')
@UseGuards(AdminAuthGuard)
export class AdminsController {
    constructor(private readonly adminservice: AdminsService) { }

    @Get('users')
    viewUsers() {
        return this.adminservice.viewUsers()
    }

    @Post('find/:id')
    findOneUser(@Param('id') userId: number, @AuthUser('id') adminId: number) {
        return this.adminservice.findOneUser(userId, adminId)
    }

    @Post('block/:id')
    blockUser(@AuthUser('id') adminId: number, @Param('id') userId: number) {
        return this.adminservice.blockUser(userId, adminId)
    }

    @Post('unBlock/:id')
    unBlockUser(@Param('id') userId: number, @AuthUser('id') adminId: number) {
        return this.adminservice.unBlockUser(userId, adminId)
    }

    @Post('search')
    findUser(@Body() dto: findUserDto, @AuthUser('id') adminId: number) {
        return this.adminservice.findUserByQuery(dto, adminId);
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Get('me')
    viewMyProfile(@AuthUser('id') adminId: number) {
        return this.adminservice.viewMyprofile(adminId)
    }
    @Post('admin/:id')
    findOneAdmin(@AuthUser('id') adminId: number, @Param('id') searchAdmin: number) {
        return this.adminservice.findeOneAdmin(adminId, searchAdmin)
    }

    @Get('all-admins')
    allAdmins() {
        return this.adminservice.allAdmins()
    }

    @Post('delete-admin/:id')
    deleteAdmin(@AuthUser('id') adminId: number, @Param('id') deletedId: number) {
        return this.adminservice.deleteAdmin(adminId, deletedId)
    }
}
