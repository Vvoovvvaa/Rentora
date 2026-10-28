import {
  Agency,
  EmailStatusEnum,
  Property,
  PropertyImage,
  PropertyViews,
  Report,
  User,
} from '@app/common-rentora/database/entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { CreatePropertyDto } from './dto/create-property.dto';
import {
  accauntSatus,
  PropertyPublishing,
  PropertyStatus,
} from '@app/common-rentora/enums';
import { changePropertyDto } from './dto/change-property.dto';
import { PhotoValidator } from '@app/common-rentora/helpers';
import { UploadService } from '../upload/upload.service';
import { SenderService } from '@app/common-rentora/smtp';
import { CreateReportDto } from './dto/create-report.dto';
import { PropertyMapDto } from './dto/property-map.dto';
import { applyPropertyFilters } from '../search/property-filter.helper';
import { PropertyPriceHistory } from '@app/common-rentora/database/entity/price-history';
import { SubscriptionService } from '../subscription/subscription.service';

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

    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,

    private readonly uploadservice: UploadService,
    private readonly senderservice: SenderService,
    private readonly i18n: I18nService,
    private readonly subscriptionService: SubscriptionService,
    private readonly dataSource: DataSource,
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
    let agency: Agency | null = null;

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (dto.agencyId !== undefined) {
      agency = await this.agencyRepo.findOne({
        where: { id: dto.agencyId },
        relations: { owner: true },
      });

      if (!agency) {
        throw new NotFoundException('Agency Not Found');
      }

      if (agency.verified === false) {
        throw new ConflictException("Agency Not verified");
      }

      if (agency.owner.id !== userId) {
        throw new ForbiddenException(
          'You cannot create a property for this agency',
        );
      }
    }

    if (!user) {
      throw new BadRequestException(this.t('property.USER_NOT_FOUND'));
    }

    if (user.gmailStatus !== EmailStatusEnum.VERIFIED) {
      throw new BadRequestException(this.t('property.VERIFY_EMAIL'));
    }

    await this.checkActivePropertyLimit(userId);

    const propertyData = { ...dto };
    delete propertyData.agencyId;

    const property = this.propertyRepo.create({
      ...propertyData,
      owner: user,
      status: PropertyStatus.ACTIVE,
      agency: agency ?? undefined,
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
      void this.senderservice.sendEmail({
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
      relations: { images: true, agency: { image: true } },
    });
  }

  async changeProperty(
    userId: number,
    propId: number,
    dto: changePropertyDto,
  ) {
    const property = await this.propertyRepo.findOne({
      where: { id: propId, owner: { id: userId } },
    });

    if (!property) {
      throw new BadRequestException(this.t('property.PROPERTY_NOT_FOUND'));
    }

    const oldPrice = Number(property.price);
    const oldCurrency = property.currency;

    // Agency assignment is intentionally create-only.
    // Drop unknown runtime fields to protect the relation.
    const propertyData = { ...dto } as changePropertyDto & {
      agencyId?: number;
    };

    delete propertyData.agencyId;
    Object.assign(property, propertyData);

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

    return this.propertyRepo.save(property);
  }

  async myProperties(userId: number) {
    return this.propertyRepo.find({
      where: { owner: { id: userId, accauntStatus: accauntSatus.ACTIVE } },
      relations: { images: true, owner: true, agency: { image: true } },
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
      message: this.t('property.PROPERTY_DELETED', {
        title: property.title,
      }),
    };
  }

  async findProperty(propId: number) {
    const property = await this.propertyRepo
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.images', 'images')
      .leftJoin('property.owner', 'owner')
      .leftJoinAndSelect('owner.image', 'ownerImage')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('agency.image', 'agencyImage')
      .addSelect([
        'owner.id',
        'owner.name',
        'owner.phone',
        'owner.gmailStatus',
      ])
      .where('property.id = :propId', { propId })
      .andWhere('property.status = :status', {
        status: PropertyStatus.ACTIVE,
      })
      .getOne();

    if (!property) {
      throw new NotFoundException(
        this.t('property.PROPERTY_NOT_FOUND_TRY_AGAIN'),
      );
    }

    property.view += 1;

    await this.propertyRepo.save(property);

    const propertyView = this.propertyViews.create({
      property,
    });

    await this.propertyViews.save(propertyView);

    return property;
  }

  async allProperties() {
    return this.propertyRepo.find({
      where: { status: PropertyStatus.ACTIVE },
      relations: {
        owner: true,
        images: true,
        agency: { image: true },
      },
      // Boosted properties first, then newest properties.
      order: {
        boops: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async achiveProperty(propid: number, userId: number) {
    const property = await this.propertyRepo.findOne({
      where: { id: propid, owner: { id: userId } },
      relations: { owner: true },
    });

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

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
      throw new ForbiddenException(
        this.t('property.CANNOT_ARCHIVE_PROPERTY'),
      );
    }

    property.status = PropertyStatus.ARCHIVED;
    await this.propertyRepo.save(property);

    return {
      message: this.t('property.PROPERTY_ARCHIVED'),
    };
  }

  async restoreProperty(propid: number, userId: number) {
    const property = await this.propertyRepo.findOne({
      where: {
        id: propid,
        owner: { id: userId },
      },
      relations: {
        owner: true,
      },
    });

    if (!property) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    if (property.owner.id !== userId) {
      throw new ForbiddenException(
        this.t('property.CANNOT_RESTORE_PROPERTY'),
      );
    }

    if (property.status !== PropertyStatus.ARCHIVED) {
      throw new BadRequestException(
        this.t('property.PROPERTY_NOT_ARCHIVED'),
      );
    }

    await this.checkActivePropertyLimit(userId);

    property.status = PropertyStatus.ACTIVE;

    await this.propertyRepo.save(property);

    return {
      message: this.t('property.PROPERTY_RESTORED'),
    };
  }

  async compareProperties(
    userId: number,
    propId1: number,
    propId2: number,
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

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
          agency: { image: true },
        },
      }),

      this.propertyRepo.findOne({
        where: { id: propId2 },
        relations: {
          images: true,
          owner: true,
          agency: { image: true },
        },
      }),
    ]);

    if (!prop1 || !prop2) {
      throw new BadRequestException(
        this.t('property.PROPERTIES_NOT_FOUND'),
      );
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
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    const prop = await this.propertyRepo.findOne({
      where: { id: propId },
    });

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
      user,
      property: prop,
      reason: dto.report,
      description: dto.description,
    });

    await this.reportRepo.save(report);

    return { message: this.t('property.REPORT_SENT') };
  }

  async viewMyreports(userid: number) {
    const user = await this.userRepo.findOne({
      where: { id: userid },
    });

    if (!user) {
      throw new BadRequestException(this.t('property.TRY_AGAIN_LATER'));
    }

    const report = await this.reportRepo.find({
      where: { user: { id: userid } },
      relations: {
        property: { agency: { image: true } },
      },
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
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('agency.image', 'agencyImage')
      .where('property.status = :status', {
        status: PropertyStatus.ACTIVE,
      })
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

    return applyPropertyFilters(query, dto, {
      prioritizeBoops: true,
    }).getMany();
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
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('agency.image', 'agencyImage')
      .where('owner.id = :userId', { userId })
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

  async viewPriceHistory(propId: number) {
    const property = await this.propertyRepo.findOne({
      where: { id: propId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.priceHistoryRepo.find({
      where: {
        property: { id: propId },
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  private async checkActivePropertyLimit(
    userId: number,
  ): Promise<void> {
    const config = await this.subscriptionService.getUserConfig(userId);

    const activePropertiesCount = await this.propertyRepo.count({
      where: {
        owner: { id: userId },
        status: PropertyStatus.ACTIVE,
      },
    });

    if (activePropertiesCount >= config.maxProperties) {
      throw new ForbiddenException(
        `Your ${config.plan} plan allows maximum ${config.maxProperties} active properties`,
      );
    }
  }
  async activateBoops(userId: number, propertyId: number) {
    return this.dataSource.transaction(async (manager) => {
      const propertyRepo = manager.getRepository(Property);
      const userRepo = manager.getRepository(User);

      // 1. Find the property and lock it
      const property = await propertyRepo.findOne({
        where: {
          id: propertyId,
          owner: { id: userId },
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!property) {
        throw new NotFoundException(
          'Property not found or does not belong to you',
        );
      }

      // 2. Check whether Boops are still active
      if (
        property.boops &&
        property.boopsExpiredAt &&
        property.boopsExpiredAt > new Date()
      ) {
        throw new BadRequestException(
          'Boops are already activated for this property',
        );
      }

      // 3. Lock and find the user
      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 4. Check the Boops balance
      if (user.boopsCount <= 0) {
        throw new BadRequestException(
          'You have no boops. Upgrade your plan or buy more boops.',
        );
      }

      // 5. Activate Boops for 3 days
      const startedAt = new Date();
      const expiresAt = new Date(startedAt);
      expiresAt.setDate(expiresAt.getDate() + 3);

      user.boopsCount -= 1;

      property.boops = true;
      property.boopsExpiredAt = expiresAt;

      // 6. Save both changes in the transaction
      await userRepo.save(user);
      await propertyRepo.save(property);

      return {
        message: 'Boops activated successfully',
        boopsRemaining: user.boopsCount,
        propertyId: property.id,
        expiresAt,
      };
    });
  }
}