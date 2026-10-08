import { User, Admin, UserSecurity } from '@app/common-rentora/database/entity';
import { SenderService } from '@app/common-rentora/smtp';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { accauntSatus, adminRoleEnum } from '@app/common-rentora/enums';
import { findUserDto } from './dto/user-find.dto';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { RedisService } from '@app/common-rentora/redis/redis.service';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(UserSecurity)
    private readonly usersecurtyrepo: Repository<UserSecurity>,

    private readonly senderService: SenderService,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
  ) {}

  private t(key: string, args?: Record<string, any>): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang || 'am',
      args,
    });
  }

  async viewUsers() {
    return this.userRepo.find();
  }

  async findOneUser(userId: number, adminId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('admins.TRY_AGAIN_LATER'));
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { properties: true, security: true },
    });

    if (!user) {
      throw new BadRequestException(this.t('admins.USER_NOT_FOUND'));
    }

    return user;
  }

  async blockUser(userid: number, adminId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('admins.TRY_AGAIN_LATER'));
    }

    const user = await this.userRepo.findOne({ where: { id: userid } });

    if (!user) {
      throw new BadRequestException(this.t('admins.USER_NOT_FOUND'));
    }

    const userSecurity = await this.usersecurtyrepo.findOne({
      where: { user: { id: user.id } },
    });

    if (!userSecurity) {
      throw new BadRequestException(this.t('admins.TRY_AGAIN_LATER'));
    }

    if (user.accauntStatus === accauntSatus.PERMANETLY_BLOCK) {
      throw new BadRequestException(this.t('admins.USER_ALREADY_BLOCKED'));
    }

    await this.redisService.set(`blocked:user:${user.id}`, '1');
    user.accauntStatus = accauntSatus.PERMANETLY_BLOCK;
    await this.userRepo.save(user);

    if (user.gmail) {
      void this.senderService.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
        subject: 'Your accaunt are blocked',
        template: 'block-user',
        context: {
          name: user.name || user.gmail,
          year: new Date().getFullYear(),
        },
      });
    }

    return { message: this.t('admins.USER_BLOCKED', { name: user.name }) };
  }

  async unBlockUser(userId: number, adminId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('admins.TRY_AGAIN_LATER'));
    }

    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('admins.TRY_AGAIN_LATER'));
    }

    if (user.accauntStatus === accauntSatus.ACTIVE) {
      throw new BadRequestException(this.t('admins.USER_NOT_BLOCKED'));
    }

    await this.redisService.delete(`blocked:user:${user.id}`);
    user.accauntStatus = accauntSatus.ACTIVE;
    await this.userRepo.save(user);

    if (user.gmail) {
      void this.senderService.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
        subject: 'Your accaunt are Unblocked',
        template: 'unBlock-user',
        context: {
          name: user.name || user.gmail,
          year: new Date().getFullYear(),
        },
      });
    }

    return {
      message: this.t('admins.USER_UNBLOCKED', {
        name: user.name,
        admin: admin.name,
      }),
    };
  }

  async findUserByQuery(dto: findUserDto, adminId: number) {
    const admin = await this.adminRepo.findOne({
      where: {
        id: adminId,
      },
    });

    if (!admin) {
      throw new BadRequestException(this.t('admins.ADMIN_NOT_FOUND'));
    }

    const query = this.userRepo.createQueryBuilder('user');

    if (dto.name) {
      query.andWhere('user.name ILIKE :name', {
        name: `%${dto.name}%`,
      });
    }

    if (dto.gmail) {
      query.andWhere('user.gmail ILIKE :gmail', {
        gmail: `%${dto.gmail}%`,
      });
    }

    if (dto.phone) {
      query.andWhere('user.phone ILIKE :phone', {
        phone: `%${dto.phone}%`,
      });
    }

    const users = await query.getMany();

    return users;
  }

  async viewMyprofile(adminId: number) {
    const admin = await this.adminRepo.findOne({
      where: { id: adminId },
      select: {
        id: true,
        gmail: true,
        name: true,
        adminRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new BadRequestException(this.t('admins.ADMIN_NOT_FOUND'));
    }

    return admin;
  }

  async findeOneAdmin(adminId: number, searchAdmin: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('admins.ADMIN_NOT_FOUND'));
    }

    const search = await this.adminRepo.findOne({ where: { id: searchAdmin } });

    if (!search) {
      throw new BadRequestException(this.t('admins.ADMIN_NOT_FOUND'));
    }

    return search;
  }

  async allAdmins() {
    return this.adminRepo.find({
      select: {
        id: true,
        gmail: true,
        name: true,
        adminRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteAdmin(adminId: number, deltedId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });

    if (!admin) {
      throw new BadRequestException(this.t('admins.ADMIN_NOT_FOUND'));
    }

    const deleted = await this.adminRepo.findOne({ where: { id: deltedId } });

    if (!deleted) {
      throw new BadRequestException(this.t('admins.ADMIN_NOT_FOUND'));
    }

    if (adminId === deltedId) {
      throw new BadRequestException(this.t('admins.CANNOT_DELETE_SELF'));
    }

    if (admin.adminRole !== adminRoleEnum.super_admin) {
      throw new BadRequestException(this.t('admins.ONLY_SUPER_ADMIN_DELETE'));
    }

    await this.adminRepo.remove(deleted);

    return {
      message: this.t('admins.ADMIN_DELETED', {
        deleted: deleted.name,
        admin: admin.name,
      }),
    };
  }
}
