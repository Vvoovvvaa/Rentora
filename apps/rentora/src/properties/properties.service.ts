import {
  EmailStatusEnum,
  Property,
  PropertyImage,
  PropertyViews,
  Report,
  User,
} from '@app/common-rentora/database/entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyPublishing, PropertyStatus } from '@app/common-rentora/enums';
import { changePropertyDto } from './dto/change-property.dto';
import { PhotoValidator } from '@app/common-rentora/helpers';
import { UploadService } from '../upload/upload.service';
import { SenderService } from '@app/common-rentora/smtp';
import { CreateReportDto } from './dto/create-report.dto';
import { PropertyMapDto } from './dto/property-map.dto';
import { applyPropertyFilters } from '../search/property-filter.helper';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PropertyPriceHistory } from '@app/common-rentora/database/entity/price-history';

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

    @InjectRepository(PropertyPriceHistory)
    private readonly priceHistoryRepo: Repository<PropertyPriceHistory>,

    @InjectRepository(PropertyViews)
    private readonly propertyViews: Repository<PropertyViews>,

    private readonly uploadservice: UploadService,

    private readonly senderservice: SenderService,

    private readonly i18n: I18nService,
  ) { }

  private t(key: string, args?: Record<string, any>): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang || 'am',
      args,
    });
  }

  async createProperty(
    userId: number,
    dto: CreatePropertyDto,
    files: Express.Multer.File[],
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(this.t('property.USER_NOT_FOUND'));
    }

    if (user.gmailStatus !== EmailStatusEnum.VERIFIED) {
      throw new BadRequestException(this.t('property.VERIFY_EMAIL'));
    }

    const property = this.propertyRepo.create({
      ...dto,
      owner: user,
      status: PropertyStatus.ACTIVE,
    });

    const savedProperty = await this.propertyRepo.save(property);

    const priceHistory = this.priceHistoryRepo.create({
      property: savedProperty,
      price: Number(savedProperty.price),
      currency: savedProperty.currency,
    });

    await this.priceHistoryRepo.save(priceHistory);

    if (files.length) {
      const images: PropertyImage[] = [];

      for (const file of files) {
        PhotoValidator.validator(file);

        const uploaded = await this.uploadservice.uploadImage(file);

        const image = this.propertImageRepo.create({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          size: file.size,
          property: savedProperty,
        });

        images.push(image);
      }

      await this.propertImageRepo.save(images);
    }

    if (user.gmail) {
      await this.senderservice.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'no-replyexample.com',
        subject: 'Property Created',
        template: 'created-property',
        context: {
          name: user.name || user.gmail,
        },
      });
    }

    return this.propertyRepo.findOne({
      where: { id: savedProperty.id },
      relations: { images: true },
    });
  }

  async changeProperty(userId: number, propId: number, dto: changePropertyDto) {
    const property = await this.propertyRepo.findOne({
      where: { id: propId, owner: { id: userId } },
    });

    if (!property) {
      throw new BadRequestException(this.t('property.PROPERTY_NOT_FOUND'));
    }

    const oldPrice = Number(property.price);
    const oldCurrency = property.currency;

    Object.assign(property, dto);

    const savedProperty = await this.propertyRepo.save(property);
    const priceChanged =
      dto.price !== undefined && Number(dto.price) !== oldPrice;
    const currencyChanged =
      dto.currency !== undefined && dto.currency !== oldCurrency;

    if (priceChanged || currencyChanged) {
      const history = this.priceHistoryRepo.create({
        property: savedProperty,
        price: Number(savedProperty.price),
        currency: savedProperty.currency,
      });

      await this.priceHistoryRepo.save(history);
    }

    return await this.propertyRepo.save(property);
  }

  async myProperties(userId: number) {
    return await this.propertyRepo.find({
      where: { owner: { id: userId } },
      relations: { images: true, owner: true },
    });
  }

  async deleteProperty(userId: number, propId: number) {
    const property = await this.propertyRepo.findOne({
      where: { id: propId, owner: { id: userId } },
    });

    if (!property) {
      throw new NotFoundException(this.t('property.PROPERTY_NOT_FOUND'));
    }

    await this.propertyRepo.delete(property.id);

    return {
      message: this.t('property.PROPERTY_DELETED', { title: property.title }),
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
      .getOne();

    if (!property) {
      throw new NotFoundException(
        this.t('property.PROPERTY_NOT_FOUND_TRY_AGAIN'),
      );
    }

    property.view += 1;

    await this.propertyRepo.save(property);

    const propertyView = this.propertyViews.create({
      property: property,
    });

    await this.propertyViews.save(propertyView);

    return property;
  }

  async allProperties() {
    const property = await this.propertyRepo.find({
      where: { status: PropertyStatus.ACTIVE },
      relations: { owner: true, images: true },
    });
    return property;
  }

  async achiveProperty(propid: number, userId: number) {
    const property = await this.propertyRepo.findOne({
      where: { id: propid, owner: { id: userId } },
      relations: { owner: true },
    });
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!property) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    if (!user) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    if (property.status === PropertyStatus.ARCHIVED) {
      throw new BadRequestException(
        this.t('property.PROPERTY_ALREADY_ARCHIVED'),
      );
    }

    if (property.owner.id !== userId) {
      throw new ForbiddenException(this.t('property.CANNOT_ARCHIVE_PROPERTY'));
    }

    property.status = PropertyStatus.ARCHIVED;
    await this.propertyRepo.save(property);

    return {
      message: this.t('property.PROPERTY_ARCHIVED'),
    };
  }

  async restoreProperty(propid: number, userId: number) {
    const property = await this.propertyRepo.findOne({
      where: { id: propid, owner: { id: userId } },
      relations: { owner: true },
    });

    if (!property) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    if (property.owner.id !== userId) {
      throw new ForbiddenException(this.t('property.CANNOT_RESTORE_PROPERTY'));
    }

    if (property.status !== PropertyStatus.ARCHIVED) {
      throw new BadRequestException(this.t('property.PROPERTY_NOT_ARCHIVED'));
    }

    property.status = PropertyStatus.ACTIVE;
    await this.propertyRepo.save(property);

    return { message: this.t('property.PROPERTY_RESTORED') };
  }

  async compareProperties(userId: number, propId1: number, propId2: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    if (propId1 === propId2) {
      throw new BadRequestException(
        this.t('property.CANNOT_COMPARE_SAME_PROPERTY'),
      );
    }

    const [prop1, prop2] = await Promise.all([
      this.propertyRepo.findOne({
        where: { id: propId1 },
        relations: {
          images: true,
          owner: true,
        },
      }),

      this.propertyRepo.findOne({
        where: { id: propId2 },
        relations: {
          images: true,
          owner: true,
        },
      }),
    ]);

    if (!prop1 || !prop2) {
      throw new BadRequestException(this.t('property.PROPERTIES_NOT_FOUND'));
    }

    return {
      firstProperty: {
        ...prop1,
        pricePerSquareMeter: Number(prop1.price) / prop1.area,
      },

      secondProperty: {
        ...prop2,
        pricePerSquareMeter: Number(prop2.price) / prop2.area,
      },
    };
  }

  async createPropertyReport(
    dto: CreateReportDto,
    userId: number,
    propId: number,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    const prop = await this.propertyRepo.findOne({ where: { id: propId } });

    const oldReport = await this.reportRepo.findOne({
      where: {
        user: { id: userId },
        property: { id: propId },
      },
    });

    if (oldReport) {
      throw new BadRequestException(this.t('property.ALREADY_REPORTED'));
    }

    if (!prop) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    const report = this.reportRepo.create({
      user: user,
      property: prop,
      reason: dto.report,
      description: dto.description,
    });

    await this.reportRepo.save(report);

    return { message: this.t('property.REPORT_SENT') };
  }

  async viewMyreports(userid: number) {
    const user = await this.userRepo.findOne({ where: { id: userid } });

    if (!user) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    const report = await this.reportRepo.find({
      where: { user: { id: userid } },
      relations: { property: true },
    });

    if (!report) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    return report;
  }

  async viewPropertiesOnMap(dto: PropertyMapDto) {
    if (dto.south > dto.north) {
      throw new BadRequestException(
        this.t('property.INVALID_MAP_LATITUDE_BOUNDS'),
      );
    }

    if (dto.west > dto.east) {
      throw new BadRequestException(
        this.t('property.INVALID_MAP_LONGITUDE_BOUNDS'),
      );
    }

    const query = this.propertyRepo
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.images', 'images')
      .where('property.status = :status', { status: PropertyStatus.ACTIVE })
      .andWhere('property.publishing = :publishing', {
        publishing: PropertyPublishing.ACTIVE,
      })
      .andWhere('property.latitude IS NOT NULL')
      .andWhere('property.longitude IS NOT NULL')
      .andWhere('property.latitude BETWEEN :south AND :north', {
        south: dto.south,
        north: dto.north,
      })
      .andWhere('property.longitude BETWEEN :west AND :east', {
        west: dto.west,
        east: dto.east,
      });

    return applyPropertyFilters(query, dto).getMany();
  }

  async viewMyPropertiesOnMap(userId: number, dto: PropertyMapDto) {
    if (dto.south > dto.north) {
      throw new BadRequestException(
        this.t('property.INVALID_MAP_LATITUDE_BOUNDS'),
      );
    }

    if (dto.west > dto.east) {
      throw new BadRequestException(
        this.t('property.INVALID_MAP_LONGITUDE_BOUNDS'),
      );
    }

    const query = this.propertyRepo
      .createQueryBuilder('property')

      .innerJoin('property.owner', 'owner')

      .leftJoinAndSelect('property.images', 'images')

      .where('owner.id = :userId', {
        userId,
      })

      .andWhere('property.latitude IS NOT NULL')

      .andWhere('property.longitude IS NOT NULL')

      .andWhere('property.latitude BETWEEN :south AND :north', {
        south: dto.south,
        north: dto.north,
      })

      .andWhere('property.longitude BETWEEN :west AND :east', {
        west: dto.west,
        east: dto.east,
      });

    return await applyPropertyFilters(query, dto).getMany();
  }

  async viewPriceHistory(propId: number) {
    const property = await this.propertyRepo.findOne({
      where: {
        id: propId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const history = await this.priceHistoryRepo.find({
      where: {
        property: {
          id: propId,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return history;
  }
}
