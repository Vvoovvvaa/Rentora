import { Admin, Property, PropertyDeletionLog } from '@app/common-rentora/database/entity';
import { accauntSatus, PropertyPublishing, PropertyStatus } from '@app/common-rentora/enums';
import { SenderService } from '@app/common-rentora/smtp';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { deleteUserPropertyDto as DeleteUserPropertyDto } from './dto/delete-user-property.dto';

@Injectable()
export class AdminsPropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyrepo: Repository<Property>,

    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,

    @InjectRepository(PropertyDeletionLog)
    private readonly propertyDeletedrepo: Repository<PropertyDeletionLog>,

    private readonly senderserive: SenderService,

    private readonly i18n: I18nService,
  ) { }

  private t(key: string, args?: Record<string, any>): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang || 'am',
      args,
    });
  }

  async viewActiveProperties() {
    return this.propertyrepo.find({
      where: { status: PropertyStatus.ACTIVE, publishing: PropertyPublishing.ACTIVE },
      relations: { owner: true, images: true, agency: { image: true } },
    });
  }

  async viewRejectedProperties() {
    return this.propertyrepo.find({
      where: { publishing: PropertyPublishing.REJECTED },
      relations: { owner: true, images: true, agency: { image: true } },
    });
  }

  async viewExpiredProperties() {
    return this.propertyrepo.find({
      where: { publishing: PropertyPublishing.EXPIRED },
      relations: { owner: true, images: true, agency: { image: true } },
    });
  }

  async viewOneProperty(propertyId: number, adminId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('adminProperty.TRY_AGAIN_LATER'));
    }

    const property = await this.propertyrepo.findOne({
      where: { id: propertyId },
      relations: { owner: true, images: true, agency: { image: true } },
    });

    if (!property) {
      throw new BadRequestException(this.t('adminProperty.PROPERTY_NOT_FOUND'));
    }

    return property;
  }

  async acceptPropertyListing(propertyId: number, adminId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('adminProperty.TRY_AGAIN_LATER'));
    }

    const property = await this.propertyrepo.findOne({
      where: { id: propertyId },
      relations: { owner: true },
    });

    if (!property) {
      throw new BadRequestException(this.t('adminProperty.PROPERTY_NOT_FOUND'));
    }

    if (property.publishing === PropertyPublishing.ACTIVE) {
      throw new BadRequestException(
        this.t('adminProperty.PROPERTY_ALREADY_ACCEPTED'),
      );
    }

    if (property.publishing === PropertyPublishing.REJECTED) {
      throw new BadRequestException(
        this.t('adminProperty.PROPERTY_ALREADY_REJECTED'),
      );
    }

    property.publishing = PropertyPublishing.ACTIVE;
    await this.propertyrepo.save(property);

    const user = property.owner;
    if (user) {
      void this.senderserive.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
        subject: 'Property accepted',
        template: 'property-accepted',
        context: {
          name: user.name || user.gmail,
          year: new Date().getFullYear(),
        },
      });
    }

    return { message: this.t('adminProperty.PROPERTY_ACCEPTED') };
  }

  async viewPropertyListing() {
    return this.propertyrepo.find({
      where: { publishing: PropertyPublishing.PENDING },
      relations: { owner: true, images: true, agency: { image: true } },
    });
  }

  async rejectPropertyListing(propId: number, adminId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('adminProperty.TRY_AGAIN_LATER'));
    }

    const property = await this.propertyrepo.findOne({
      where: { id: propId },
      relations: { owner: true },
    });

    if (!property) {
      throw new BadRequestException(this.t('adminProperty.PROPERTY_NOT_FOUND'));
    }

    if (property.publishing === PropertyPublishing.ACTIVE) {
      throw new BadRequestException(
        this.t('adminProperty.PROPERTY_ALREADY_ACCEPTED'),
      );
    }

    if (property.publishing === PropertyPublishing.REJECTED) {
      throw new BadRequestException(
        this.t('adminProperty.PROPERTY_ALREADY_REJECTED'),
      );
    }

    property.publishing = PropertyPublishing.REJECTED;
    await this.propertyrepo.save(property);

    const user = property.owner;
    if (user) {
      void this.senderserive.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
        subject: 'Property rejected',
        template: 'property-rejected',
        context: {
          name: user.name || user.gmail,
          year: new Date().getFullYear(),
        },
      });
    }

    return { message: this.t('adminProperty.PROPERTY_REJECTED') };
  }

  async achiveProperty(propId: number, adminId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('adminProperty.TRY_AGAIN_LATER'));
    }

    const property = await this.propertyrepo.findOne({
      where: { id: propId },
      relations: { owner: true },
    });

    if (!property) {
      throw new BadRequestException(this.t('adminProperty.PROPERTY_NOT_FOUND'));
    }

    if (property.status === PropertyStatus.ARCHIVED) {
      throw new BadRequestException(
        this.t('adminProperty.PROPERTY_ALREADY_ARCHIVED'),
      );
    }

    property.status = PropertyStatus.ARCHIVED;
    await this.propertyrepo.save(property);

    const user = property.owner;
    if (user) {
      void this.senderserive.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
        subject: 'Property archived',
        template: 'property-archived',
        context: {
          name: user.name || user.gmail,
          year: new Date().getFullYear(),
        },
      });
    }

    return { message: this.t('adminProperty.PROPERTY_ARCHIVED') };
  }

  async restoreProperty(propId: number, adminId: number) {
    const admin = await this.adminRepo.findOne({
      where: {
        id: adminId,
      },
    });

    if (!admin) {
      throw new BadRequestException(this.t('adminProperty.ADMIN_NOT_FOUND'));
    }

    const property = await this.propertyrepo.findOne({
      where: {
        id: propId,
      },
    });

    if (!property) {
      throw new BadRequestException(this.t('adminProperty.PROPERTY_NOT_FOUND'));
    }

    if (property.status === PropertyStatus.ACTIVE) {
      throw new BadRequestException(
        this.t('adminProperty.PROPERTY_ALREADY_ACTIVE'),
      );
    }

    property.status = PropertyStatus.ACTIVE;

    await this.propertyrepo.save(property);

    return {
      message: this.t('adminProperty.PROPERTY_RESTORED'),
    };
  }


  async deleteProperty(propId: number, adminId: number, dto: DeleteUserPropertyDto) {
    const admin = await this.adminRepo.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new BadRequestException(
        this.t('adminProperty.TRY_AGAIN_LATER'),
      );
    }

    const property = await this.propertyrepo.findOne({
      where: { id: propId },
      relations: { owner: true },
    });

    if (!property) {
      throw new BadRequestException(
        this.t('adminProperty.PROPERTY_NOT_FOUND'),
      );
    }


    try {
      await this.propertyrepo.remove(property);
      const delete_property = await this.propertyDeletedrepo.create({
        propertyId: propId,
        reason: dto.reason,
        admin
      })

      await this.propertyDeletedrepo.save(delete_property)

      return {
        message: this.t('adminProperty.PROPERTY_DELETED'),
      };
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          message?: string;
          detail?: string;
          constraint?: string;
          table?: string;
        };

        console.error('DELETE PROPERTY FAILED:', {
          propertyId: propId,
          errorCode: driverError.code,
          errorMessage: driverError.message,
          detail: driverError.detail,
          constraint: driverError.constraint,
          table: driverError.table,
        });
      } else {
        console.error('DELETE PROPERTY FAILED:', error);
      }

      throw error;
    }
  }
}
