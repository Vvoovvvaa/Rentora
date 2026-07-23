import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { forgetPasswordDto } from './dto/forget.dto';
import { ChangedPassword } from './dto/acceptchangePassword.dto';
import { sendVerifyCodeDto } from './dto/sendverifyCode.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authservice:AuthService){}

    @Post("register")
    async register(@Body() body: CreateAuthDto ){
        return this.authservice.register(body)
    }

    @Post("login")
    async login(@Body() body: LoginDto){
        return this.authservice.login(body)
    }

    @Post("sendCode")
    async sendCode(@Body() body: sendVerifyCodeDto){
        return this.authservice.sendVerifyCode(body)
    }

    @Post("Verify")
    async verifyEMail(@Body() body: VerifyEmailDto){
        return this.authservice.VerifyEmail(body)
    }


    @Post("forget")
    async forget(@Body() body: forgetPasswordDto){
        return this.authservice.forgetPassword(body)
    }

    @Post("NewPassword")
    async newPassword(@Body() body: ChangedPassword){
        return this.authservice.acceptChangePassword(body)
    }
}
