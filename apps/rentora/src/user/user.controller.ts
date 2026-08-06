import { Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthUser } from '@app/common-rentora/decorators';
import { FileInterceptor } from '@nestjs/platform-express';

import { UserService } from './user.service';
import { changeUserdataDto } from './dto/changeData.dto';
import { AuthGuard } from '@app/common-rentora/guard';
import { changePasswordDto } from './dto/change-password.dto';
import { ChangeGmailDto } from './dto/change-gmail.dto';

@UseGuards(AuthGuard)
@Controller('user')
export class UserController {
    constructor(private readonly userservice: UserService) { }

    @Post('change')
    @UseInterceptors(FileInterceptor('photo'))
    changeData(@Body() body: changeUserdataDto, @AuthUser('id') userId: number, @UploadedFile() file: Express.Multer.File) {
        return this.userservice.changeData(body, userId, file)
    }

    @Post('password')
    changePassword(@Body() body: changePasswordDto, @AuthUser('id') userId:number){
        return this.userservice.changePassword(body,userId)
    }

    @Post('email')
    changeEmail(@Body() body: ChangeGmailDto, @AuthUser('id') userId:number ){
        return this.userservice.changeGmail(body,userId)
    }

    @Get("me")
    viewMyProfile(@AuthUser('id') userId: number){
        return this.userservice.viewMyProfile(userId)
    }

    @Delete('del')
    deleteProfile(@AuthUser('id') userId:number){
        return this.userservice.deleteAccount(userId)
    }

    @Post('fav/:id')
    addFavorites(@AuthUser('id') userId:number, @Param('id') propertyId:number){
        return this.userservice.addFavorites(userId,propertyId)
    }
    
    @Get('fav')
    myFavorites(@AuthUser('id') userId:number){
        return this.userservice.viewFavorites(userId)
    }

}
    
