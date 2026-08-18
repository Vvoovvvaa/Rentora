import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import {
  EmailStatusEnum,
  Favorites,
  Property,
  User,
  UserImage,
  UserSecurity,
} from '@app/common-rentora/database/entity';
import { changeUserdataDto } from './dto/changeData.dto';
import { PhotoValidator } from '@app/common-rentora/helpers';
import { UploadService } from '../upload/upload.service';
import { changePasswordDto } from './dto/change-password.dto';
import { SenderService } from '@app/common-rentora/smtp';
import { ChangeGmailDto } from './dto/change-gmail.dto';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(UserImage)
    private readonly userImageRepo: Repository<UserImage>,

    @InjectRepository(UserSecurity)
    private readonly userSecurityRepo: Repository<UserSecurity>,

    @InjectRepository(Favorites)
    private readonly favoritesRepo: Repository<Favorites>,

    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,

    private readonly uploadservice: UploadService,
    private readonly senderservice: SenderService,
    private readonly i18n: I18nService,
  ) {}

  private t(key: string, args?: Record<string, any>): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang || 'am',
      args,
    });
  }

  async changeData(
    dto: changeUserdataDto,
    userId: number,
    file: Express.Multer.File,
  ) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { image: true },
    });

    if (!user) {
      throw new BadRequestException(this.t('user.TRY_AGAIN_LATER'));
    }

    Object.assign(user, dto);

    if (file) {
      PhotoValidator.validator(file);

      const uploaded = await this.uploadservice.uploadImage(file);

      const image = this.userImageRepo.create({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        size: file.size,
        user: user,
      });

      user.image = image;
    }

    await this.userRepo.save(user);

    const updatedUser = await this.userRepo.findOne({
      where: { id: userId },
      relations: {
        image: true,
      },
    });

    if (!updatedUser) {
      throw new BadRequestException(this.t('user.TRY_AGAIN_LATER'));
    }

    const profile = { ...updatedUser };
    Reflect.deleteProperty(profile, 'password');
    return profile;
  }

  async changePassword(dto: changePasswordDto, userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('user.TRY_AGAIN_LATER'));
    }

    const isMatch = await bcrypt.compare(dto.Oldpassword, user.password);

    if (!isMatch) {
      throw new BadRequestException(this.t('user.INVALID_PASSWORD'));
    }

    user.password = await bcrypt.hash(dto.NewPassword, 10);
    await this.userRepo.save(user);

    if (user.gmail) {
      await this.senderservice.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        subject: 'Password is changed',
        template: 'change-password',
        context: {
          name: user.name || user.gmail,
          year: new Date().getFullYear(),
        },
      });
    }
    return { message: this.t('user.PASSWORD_CHANGED') };
  }

  async changeGmail(dto: ChangeGmailDto, userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('user.TRY_AGAIN_LATER'));
    }

    user.gmail = dto.gmail;
    user.gmailStatus = EmailStatusEnum.NOT_VERIFIED;
    await this.userRepo.save(user);

    if (user.gmail) {
      await this.senderservice.sendEmail({
        to: dto.gmail,
        from: process.env.SMTP_FROM || 'no-ropely@example.com',
        subject: 'change gmail',
        template: 'change-email',
        context: {
          name: user.name || user.gmail,
          year: new Date().getFullYear(),
        },
      });
    }
    return { message: this.t('user.EMAIL_CHANGED', { email: user.gmail }) };
  }

  async viewMyProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { image: true, properties: true },
    });

    if (!user) {
      throw new BadRequestException(this.t('user.TRY_AGAIN_LATER'));
    }

    const profile = { ...user };
    Reflect.deleteProperty(profile, 'password');
    return profile;
  }

  async deleteAccount(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: {
        security: true,
        image: true,
      },
    });

    if (!user) {
      throw new BadRequestException(this.t('user.TRY_AGAIN'));
    }

    if (user.security) {
      await this.userSecurityRepo.remove(user.security);
    }

    if (user.image) {
      await this.userImageRepo.remove(user.image);
    }

    await this.userRepo.remove(user);

    return {
      message: this.t('user.USER_DELETED', { name: user.name }),
    };
  }

  async addFavorites(userId: number, propertyId: number) {
    const favorite = await this.favoritesRepo.findOne({
      where: {
        user: {
          id: userId,
        },
        property: {
          id: propertyId,
        },
      },
    });

    if (favorite) {
      await this.favoritesRepo.remove(favorite);

      return {
        status: 'removed',
      };
    }

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    const property = await this.propertyRepo.findOne({
      where: {
        id: propertyId,
      },
    });

    if (!user || !property) {
      throw new BadRequestException(this.t('user.USER_OR_PROPERTY_NOT_FOUND'));
    }

    const newFavorite = this.favoritesRepo.create({
      user: user,
      property: property,
    });

    await this.favoritesRepo.save(newFavorite);

    return {
      status: 'added',
    };
  }

  async viewFavorites(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const favorites = await this.favoritesRepo.find({
      where: { user: { id: userId } },
      relations: { property: { images: true, owner: true } },
    });

    if (!user) {
      throw new BadRequestException(this.t('user.TRY_AGAIN_LATER'));
    }

    return favorites;
  }
}
