import { EmailStatusEnum, Property, PropertyImage, Report, User } from '@app/common-rentora/database/entity';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyPublishing, PropertyStatus, ReportStatusEnum } from '@app/common-rentora/database/enums';
import { changePropertyDto } from './dto/change-property.dto';
import { PhotoValidator } from '@app/common-rentora/helpers';
import { UploadService } from '../upload/upload.service';
import { SenderService } from '@app/common-rentora/smtp';
import { CreateReportDto } from './dto/create-report.dto';
import { PropertyMapDto } from './dto/property-map.dto';
import { applyPropertyFilters } from '../search/property-filter.helper';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Property)
        private readonly propertyRepo: Repository<Property>,

        @InjectRepository(PropertyImage)
        private readonly propertImageRepo: Repository<PropertyImage>,

        @InjectRepository(Report)
        private readonly reportRepo: Repository<Report>,

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
        return await this.propertyRepo.find({
            where: { owner: { id: userId } },
            relations: { images: true, owner: true },
        })

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
        const property = await this.propertyRepo
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.images', 'images')
            .leftJoin('property.owner', 'owner')
            .leftJoinAndSelect('owner.image', 'ownerImage')
            .addSelect(['owner.id', 'owner.name', 'owner.phone', 'owner.gmailStatus'])
            .where('property.id = :propId', { propId })
            .andWhere('property.status = :status', { status: PropertyStatus.ACTIVE })
            .getOne()

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
        const property = await this.propertyRepo.findOne({ where: { id: propid, owner: { id: userId } }, relations: { owner: true } })
        const user = await this.userRepo.findOne({ where: { id: userId } })

        if (!property) {
            throw new BadRequestException('Please,try again later')
        }

        if (!user) {
            throw new BadRequestException('please,try again later')
        }

        if (property.status === PropertyStatus.ARCHIVED) {
            throw new BadRequestException(`property already achived`)
        }

        if (property.owner.id !== userId) {
            throw new ForbiddenException("You cannot archive this property")
        }

        property.status = PropertyStatus.ARCHIVED
        await this.propertyRepo.save(property)

        return {
            message: " Property status was succefuly chanaged"
        }

    }

    async restoreProperty(propid: number, userId: number) {
        const property = await this.propertyRepo.findOne({
            where: { id: propid, owner: { id: userId } },
            relations: { owner: true },
        })

        if (!property) {
            throw new BadRequestException('Please,try again later')
        }

        if (property.owner.id !== userId) {
            throw new ForbiddenException("You cannot restore this property")
        }

        if (property.status !== PropertyStatus.ARCHIVED) {
            throw new BadRequestException('property is not archived')
        }

        // Keep the moderation decision intact: restoring only changes visibility
        // from archived back to the listing's previous active lifecycle.
        property.status = PropertyStatus.ACTIVE
        await this.propertyRepo.save(property)

        return { message: "Property status was successfully restored" }
    }

    async compareProperties(userId: number, propId1: number, propId2: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } })

        if (!user) {
            throw new BadRequestException('please try again later')
        }

        if (propId1 === propId2) {
            throw new BadRequestException(`You cannot compare same property`)
        }


        const [prop1, prop2] = await Promise.all([
            this.propertyRepo.findOne({
                where: { id: propId1 },
                relations: {
                    images: true,
                    owner: true
                }
            }),

            this.propertyRepo.findOne({
                where: { id: propId2 },
                relations: {
                    images: true,
                    owner: true
                }
            })
        ])

        if (!prop1 || !prop2) {
            throw new BadRequestException(
                'One or more properties not found'
            )
        }


        return {
            firstProperty: {
                ...prop1,
                pricePerSquareMeter:
                    Number(prop1.price) / prop1.area
            },

            secondProperty: {
                ...prop2,
                pricePerSquareMeter:
                    Number(prop2.price) / prop2.area
            }
        }

    }

    async createPropertyReport(dto: CreateReportDto, userId: number, propId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } })

        if (!user) {
            throw new BadRequestException('Please try again later')
        }

        const prop = await this.propertyRepo.findOne({ where: { id: propId } })


        const oldReport = await this.reportRepo.findOne({
            where: {
                user: { id: userId },
                property: { id: propId }
            }
        })

        if (oldReport) {
            throw new BadRequestException(
                'You already reported this property'
            )
        }

        if (!prop) {
            throw new BadRequestException("please try again later")
        }

        const report = this.reportRepo.create({
            user: user,
            property: prop,
            reason: dto.report,
            description: dto.description
        })

        await this.reportRepo.save(report)

        return { message: 'Report successfully sent. Our admins will review it.' }

    }

    async viewMyreports(userid: number) {
        const user = await this.userRepo.findOne({ where: { id: userid } })

        if (!user) {
            throw new BadRequestException(`Please try again later`)
        }

        const report = await this.reportRepo.find({ where: { user: { id: userid } }, relations: { property: true } })

        if (!report) {
            throw new BadRequestException('please try again later')
        }

        return report
    }

    async viewPropertiesOnMap(dto: PropertyMapDto) {
        if (dto.south > dto.north) {
            throw new BadRequestException('Invalid map latitude bounds');
        }

        if (dto.west > dto.east) {
            throw new BadRequestException('Invalid map longitude bounds');
        }

        const query = this.propertyRepo
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.images', 'images')
            .where('property.status = :status', { status: PropertyStatus.ACTIVE })
            .andWhere('property.publishing = :publishing', { publishing: PropertyPublishing.ACTIVE })
            .andWhere('property.latitude IS NOT NULL')
            .andWhere('property.longitude IS NOT NULL')
            .andWhere('property.latitude BETWEEN :south AND :north', { south: dto.south, north: dto.north })
            .andWhere('property.longitude BETWEEN :west AND :east', { west: dto.west, east: dto.east });

        return applyPropertyFilters(query, dto).getMany();
    }

    async viewMyPropertiesOnMap(userId: number,dto: PropertyMapDto) {

        if (dto.south > dto.north) {
            throw new BadRequestException(
                'Invalid map latitude bounds'
            )
        }

        if (dto.west > dto.east) {
            throw new BadRequestException(
                'Invalid map longitude bounds'
            )
        }

        const query = this.propertyRepo
            .createQueryBuilder('property')

            .innerJoin(
                'property.owner',
                'owner'
            )

            .leftJoinAndSelect(
                'property.images',
                'images'
            )

            .where(
                'owner.id = :userId',
                {
                    userId
                }
            )

            .andWhere(
                'property.latitude IS NOT NULL'
            )

            .andWhere(
                'property.longitude IS NOT NULL'
            )

            .andWhere(
                'property.latitude BETWEEN :south AND :north',
                {
                    south: dto.south,
                    north: dto.north
                }
            )

            .andWhere(
                'property.longitude BETWEEN :west AND :east',
                {
                    west: dto.west,
                    east: dto.east
                }
            );

        return await applyPropertyFilters(query,dto).getMany();
    }

}
