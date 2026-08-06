import { EmailStatusEnum, Property, PropertyImage, User } from '@app/common-rentora/database/entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyStatus } from '@app/common-rentora/database/enums';
import { changePropertyDto } from './dto/change-property.dto';
import { PhotoValidator } from '@app/common-rentora/helpers';
import { UploadService } from '../upload/upload.service';
import { SenderService } from '@app/common-rentora/smtp';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Property)
        private readonly propertyRepo: Repository<Property>,

        @InjectRepository(PropertyImage)
        private readonly propertImageRepo: Repository<PropertyImage>,

        private readonly uploadservice: UploadService,

        private readonly senderservice: SenderService
    ) { }

    async createProperty(userId: number, dto: CreatePropertyDto, files: Express.Multer.File[]) {
        const user = await this.userRepo.findOne({
            where: { id: userId }
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.gmailStatus !== EmailStatusEnum.VERIFIED) {
            throw new BadRequestException('Please Verify your Email');
        }

        const property = this.propertyRepo.create({
            ...dto,
            owner: user,
            status: PropertyStatus.ACTIVE
        });

        const savedProperty = await this.propertyRepo.save(property);

        if (files.length) {
            const images: PropertyImage[] = [];

            for (const file of files) {
                PhotoValidator.validator(file);

                const uploaded: any = await this.uploadservice.uploadImage(file);

                const image = this.propertImageRepo.create({
                    url: uploaded.secure_url,
                    publicId: uploaded.public_id,
                    size: file.size,
                    property: savedProperty
                });

                images.push(image);
            }

            await this.propertImageRepo.save(images);
        }

        if (user.gmail) {
            await this.senderservice.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || "no-replyexample.com",
                subject: 'Property Created',
                template: 'created-property',
                context: {
                    name: user.name || user.gmail
                }
            })
        }

        return this.propertyRepo.findOne({
            where: { id: savedProperty.id },
            relations: { images: true }
        });
    }

    async changeProperty(userId: number, propId: number, dto: changePropertyDto) {
        const property = await this.propertyRepo.findOne({ where: { id: propId, owner: { id: userId } } })

        if (!property) {
            throw new BadRequestException('Property not found')
        }

        Object.assign(property, dto)

        return await this.propertyRepo.save(property)

    }


    async myProperties(userId: number) {

        return await this.propertyRepo.find({ where: { owner: { id: userId } } })

    }


    async deleteProperty(userId: number, propId: number) {
        const property = await this.propertyRepo.findOne({ where: { id: propId, owner: { id: userId } } })

        if (!property) {
            throw new NotFoundException('property not found')
        }

        await this.propertyRepo.delete(property.id);

        return {
            message: `${property.title} property was successfully deleted`,
        };

    }

    async findProperty(propId: number) {
        const property = await this.propertyRepo.findOne({ where: { id: propId, status: PropertyStatus.ACTIVE }, relations: { owner: true, images: true } })

        if (!property) {
            throw new NotFoundException("Property Not found,Please try again")
        }

        property.views++

        await this.propertyRepo.save(property)


        return property
    }


    async allProperties() {
        const property = await this.propertyRepo.find({ where: { status: PropertyStatus.ACTIVE }, relations: { owner: true, images: true } })
        return property
    }

    async achiveProperty(propid: number, userId: number) {
        const property = await this.propertyRepo.findOne({ where: { id: propid, owner: {id: userId} },relations: {owner: true}})
        const user = await this.userRepo.findOne({ where:{id: userId}})

        if (!property) {
            throw new BadRequestException('Please,try again later')
        }

        if(!user){
            throw new BadRequestException('please,try again later')
        }

        if (property.status === PropertyStatus.ARCHIVED) {
            throw new BadRequestException(`property already achived`)
        }

        property.status = PropertyStatus.ARCHIVED

        return {
            message: " Property status was succefuly chanaged"
        }


    }

}
