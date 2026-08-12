import { Admin, Property } from '@app/common-rentora/database/entity';
import { PropertyPublishing, PropertyStatus } from '@app/common-rentora/database/enums';
import { SenderService } from '@app/common-rentora/smtp';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AdminsPropertiesService {
    constructor(
        @InjectRepository(Property)
        private readonly propertyrepo: Repository<Property>,

        @InjectRepository(Admin)
        private readonly adminRepo: Repository<Admin>,

        private readonly senderserive: SenderService
    ) { }

    async viewProperties() {
        return this.propertyrepo.find({relations: {owner: true, images: true}})
    }

    async viewOneProperty(propertyId: number, adminId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId }, })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const property = await this.propertyrepo.findOne({ where: { id: propertyId }, relations: { owner: true, images: true } })

        if (!property) {
            throw new BadRequestException("porperty not found")
        }

        return property

    }

    async acceptPropertyListing(propertyId: number, adminId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const property = await this.propertyrepo.findOne({ where: { id: propertyId }, relations: { owner: true } })

        if (!property) {
            throw new BadRequestException("porperty not found")
        }

        if (property.publishing === PropertyPublishing.ACTIVE) {
            throw new BadRequestException("property already Accpeted")
        }

        if (property.publishing === PropertyPublishing.REJECTED) {
            throw new BadRequestException("property already Rejected")
        }

        property.publishing = PropertyPublishing.ACTIVE
        await this.propertyrepo.save(property)

        const user = property.owner
        if (user) {
            await this.senderserive.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
                subject: 'Property accepted',
                template: 'property-accepted',
                context: {
                    name: user.name || user.gmail,
                    year: new Date().getFullYear()
                }
            })
        }

        return { message: "property succesful Accepted" }

    }

    async viewPropertyListing() {
        return this.propertyrepo.find({ where: { publishing: PropertyPublishing.PENDING }, relations: {owner: true, images:true} })
    }

    async rejectPropertyListing(propId: number, adminId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const property = await this.propertyrepo.findOne({ where: { id: propId }, relations: { owner: true } })

        if (!property) {
            throw new BadRequestException("porperty not found")
        }

        if (property.publishing === PropertyPublishing.ACTIVE) {
            throw new BadRequestException("property already Accpeted")
        }

        if (property.publishing === PropertyPublishing.REJECTED) {
            throw new BadRequestException("property already Rejected")
        }

        property.publishing = PropertyPublishing.REJECTED
        await this.propertyrepo.save(property)

        const user = property.owner
        if (user) {
            await this.senderserive.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
                subject: 'Property rejected',
                template: 'property-rejected',
                context: {
                    name: user.name || user.gmail,
                    year: new Date().getFullYear()
                }
            })

        }

        return { message: 'Property Rejected' }

    }


    async achiveProperty(propId: number, adminId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const property = await this.propertyrepo.findOne({ where: { id: propId }, relations: { owner: true } })

        if (!property) {
            throw new BadRequestException("porperty not found")
        }


        if (property.status === PropertyStatus.ARCHIVED) {
            throw new BadRequestException("Property already archieved by User")
        }

        property.status = PropertyStatus.ARCHIVED
        await this.propertyrepo.save(property)

        const user = property.owner
        if (user) {
            await this.senderserive.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
                subject: 'Property archived',
                template: 'property-archived',
                context: {
                    name: user.name || user.gmail,
                    year: new Date().getFullYear()
                }
            })
        }

        return { message: "property archived" }

    }

    async restoreProperty(
        propId: number,
        adminId: number
    ) {
        const admin = await this.adminRepo.findOne({
            where: {
                id: adminId
            }
        })

        if (!admin) {
            throw new BadRequestException(
                'Admin not found'
            )
        }

        const property = await this.propertyrepo.findOne({
            where: {
                id: propId
            }
        })

        if (!property) {
            throw new BadRequestException(
                'Property not found'
            )
        }

        if (
            property.status ===
            PropertyStatus.ACTIVE
        ) {
            throw new BadRequestException(
                'Property is already active'
            )
        }

        property.status =
            PropertyStatus.ACTIVE

        await this.propertyrepo.save(property)

        return {
            message:
                'Property successfully restored'
        }
    }

    async deleteProperty(propId: number, adminId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const property = await this.propertyrepo.findOne({ where: { id: propId }, relations: { owner: true } })

        if (!property) {
            throw new BadRequestException("porperty not found")
        }

        await this.propertyrepo.remove(property)
        return { message: `property succesful deleted` }
    }
}