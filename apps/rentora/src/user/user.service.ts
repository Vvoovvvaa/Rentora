import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from "bcrypt";

import { EmailStatusEnum, User, UserImage } from '@app/common-rentora/database/entity';
import { changeUserdataDto } from './dto/changeData.dto';
import { PhotoValidator } from '@app/common-rentora/helpers';
import { UploadService } from '../upload/upload.service';
import { changePasswordDto } from './dto/change-password.dto';
import { SenderService } from '@app/common-rentora/smtp';
import { ChangeGmailDto } from './dto/change-gmail.dto';
import { number } from 'joi';


@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(UserImage)
        private readonly userImageRepo: Repository<UserImage>,

        private readonly uploadservice: UploadService,
        private readonly senderservice: SenderService


    ) { }

    async changeData(dto: changeUserdataDto, userId: number, file: Express.Multer.File) {
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: { image: true } })

        if (!user) {
            throw new BadRequestException('please try again later')
        }

        Object.assign(user, dto)

        if (file) {

            PhotoValidator.validator(file)

            const uploaded = await this.uploadservice.uploadImage(file)

            const image = this.userImageRepo.create({
                url: uploaded.secure_url,
                publicId: uploaded.public_id,
                size: file.size,
                user: user
            })

            user.image = image
        }

        await this.userRepo.save(user)

        return await this.userRepo.findOne({
            where: { id: userId },
            relations: {
                image: true
            }
        })
    }

    async changePassword(dto: changePasswordDto, userId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } })

        if (!user) {
            throw new BadRequestException('try again later')
        }

        const isMatch = await bcrypt.compare(dto.Oldpassword, user.password)

        if (!isMatch) {
            throw new BadRequestException('Invalid password, try again later')
        }

        user.password === await bcrypt.hash(dto.NewPassword, 10)

        if (user.gmail) {
            await this.senderservice.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || 'no-reply@example.com',
                subject: 'Password is changed',
                template: 'change-password',
                context: {
                    name: user.name || user.gmail,
                    year: new Date().getFullYear(),
                }
            })
        }
        return { message: "password succesfuly changed" }
    }


    async changeGmail(dto: ChangeGmailDto, userId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } })

        if (!user) {
            throw new BadRequestException('Please try again later')
        }

        user.gmail = dto.gmail
        user.gmailStatus = EmailStatusEnum.NOT_VERIFIED
        await this.userRepo.save(user)

        if (user.gmail) {
            await this.senderservice.sendEmail({
                to: dto.gmail,
                from: process.env.SMTP_FROM || 'no-ropely@example.com',
                subject: 'change gmail',
                template: 'change-email',
                context: {
                    name: user.name || user.gmail,
                    year: new Date().getFullYear()
                }
            })
        }
        return { message: `Your email succesfuly changed in ${user.gmail}, please verify your new email ` }
    }


    async viewMyProfile(userId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: { image: true, properties: true } })

        if (!user) {
            throw new BadRequestException('Please, try aain later')
        }

        const { password, ...profile } = user;


        return profile
    }
}
