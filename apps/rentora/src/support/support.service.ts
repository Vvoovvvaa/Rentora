import { Support, User } from '@app/common-rentora/database/entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupportDto } from './dto/create-support.dto';
import { SupportStatusEnum } from '@app/common-rentora/enums/support-status';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Support)
    private readonly supportRepo: Repository<Support>,

    private readonly i18n: I18nService,
  ) {}

  private t(key: string, args?: Record<string, any>): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang || 'am',
      args,
    });
  }

  async createSupport(dto: CreateSupportDto, userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('support.TRY_AGAIN_LATER'));
    }

    const create = this.supportRepo.create({
      ...dto,
      user,
    });

    await this.supportRepo.save(create);
    return { message: this.t('support.SUPPORT_CREATED') };
  }

  async viewMySupports(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('support.TRY_AGAIN_LATER'));
    }

    const support = await this.supportRepo.find({
      where: { user: { id: userId } },
    });

    if (support.length === 0) {
      throw new BadRequestException(this.t('support.NO_SUPPORTS'));
    }

    return support;
  }

  async viewOneSupport(userId: number, supportId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('support.TRY_AGAIN_LATER'));
    }

    const support = await this.supportRepo.findOne({
      where: { id: supportId, user: { id: userId } },
    });

    if (!support) {
      throw new BadRequestException(this.t('support.TRY_AGAIN_LATER'));
    }

    return support;
  }

  async removeSupport(userId: number, supportId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException(this.t('support.TRY_AGAIN_LATER'));
    }

    const support = await this.supportRepo.findOne({
      where: { id: supportId, user: { id: userId } },
    });

    if (!support) {
      throw new BadRequestException(this.t('support.SUPPORT_NOT_FOUND'));
    }

    support.status = SupportStatusEnum.CANCELED;
    await this.supportRepo.save(support);

    return { message: this.t('support.SUPPORT_CANCELED') };
  }
}
