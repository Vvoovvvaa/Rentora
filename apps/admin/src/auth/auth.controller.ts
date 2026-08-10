import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from '@app/common-rentora/guard';
import { CreateAdminDto } from './dto/create-admin-dto';
import { AuthUser } from '@app/common-rentora/decorators';
import { AdminAuthService } from './auth.service';
import { LoginDto } from 'apps/rentora/src/auth/dto/login.dto';
import { changeAdminPasswordDto } from './dto/change-password.dto';
import { SendCodeChangePasswordDto } from './dto/send-code-change-password';
import { NewPassowrdDto } from './dto/new-password.dto';

@Controller('admin-auth')
export class AdminAuthController {
    constructor(
        private readonly authservice: AdminAuthService
    ) { }

    @Post('create')
    @UseGuards(AdminAuthGuard)
    createAdmin(@Body() body: CreateAdminDto, @AuthUser('id') adminId: number) {
        return this.authservice.createAdmin(body, adminId)
    }

    @Post('login')
    loginAdmin(@Body() body: LoginDto){
        return this.authservice.loginAdmin(body)
    }

    @Post('change-password')
    @UseGuards(AdminAuthGuard)
    changeAdminPassword(@Body() body: changeAdminPasswordDto, @AuthUser('id') adminId: number){
        return this.authservice.changeAdminPassword(body,adminId)
    }

    @Post("sendCode")
    sendCode(@Body() body: SendCodeChangePasswordDto){
        return this.authservice.SendCodeforgetPassword(body)
    }

    @Post("newPassword")
    newPassord(@Body() body: NewPassowrdDto){
        return this.authservice.acceptNewpassword(body)
    }

}
