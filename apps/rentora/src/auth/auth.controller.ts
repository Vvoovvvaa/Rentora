import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/auth.dto';
import { LoginDto } from './dto/login.dto';

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
}
