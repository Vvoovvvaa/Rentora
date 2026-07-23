import { EmailStatusEnum, Property, User } from '@app/common-rentora/database/entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyStatus } from '@app/common-rentora/database/enums';
import { changePropertyDto } from './dto/change-property.dto';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Property)
        private readonly propertyRepo: Repository<Property>
    ) { }

    async createProperty(userId: number, dto: CreatePropertyDto) {

        const user = await this.userRepo.findOne({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new BadRequestException('User not found')
        }

        if(user.gmailStatus !== EmailStatusEnum.VERIFIED){
            throw new BadRequestException(`Please Verify your Email`)
        }

        const property = this.propertyRepo.create({
            ...dto,
            owner: user,
            status: PropertyStatus.ACTIVE
        })

        return await this.propertyRepo.save(property)
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

}
