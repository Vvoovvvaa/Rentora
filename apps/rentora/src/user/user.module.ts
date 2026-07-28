import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { userInfo } from 'os';
import { User, UserImage } from '@app/common-rentora/database/entity';
import { UserService } from './user.service';
import { UploadService } from '../upload/upload.service';
import { EmailModule, SenderService } from '@app/common-rentora/smtp';

@Module({
    imports: [TypeOrmModule.forFeature([User,UserImage]), EmailModule],
    controllers: [UserController],
    providers: [UserService,UploadService,]
})
export class UserModule {}
