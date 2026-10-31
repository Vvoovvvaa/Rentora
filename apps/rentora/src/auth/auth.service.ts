import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { LoginDto } from './dto/login.dto';
import { CreateAuthDto } from './dto/auth.dto';
import { IJwtconfig } from '@app/common-rentora/models/jwt.config';
import {
  EmailStatusEnum,
  SecretCode,
  User,
  UserSecurity,
} from '@app/common-rentora/database/entity';
import { accauntSatus } from '@app/common-rentora/enums/accaunt-status';
import { SenderService } from '@app/common-rentora/smtp';
import { randomCode } from '@app/common-rentora/helpers';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { forgetPasswordDto } from './dto/forget.dto';
import { ChangedPassword } from './dto/acceptchangePassword.dto';
import { sendVerifyCodeDto } from './dto/sendverifyCode.dto';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { randomUUID } from 'crypto';
import { RedisService } from '@app/common-rentora/redis/redis.service';
import { JwtPayload } from '@app/common-rentora/interfaces';

@Injectable()
export class AuthService {
  private jwtconfig: IJwtconfig;
  
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(UserSecurity)
    private readonly usersecurityRepo: Repository<UserSecurity>,

    @InjectRepository(SecretCode)
    private readonly secretCodeRepo: Repository<SecretCode>,

    private readonly jwtservice: JwtService,
    private readonly redisservice: RedisService,
    private readonly configService: ConfigService,
    private readonly senderservice: SenderService,
    private readonly i18n: I18nService,
  ) {
    this.jwtconfig = this.configService.get('JWTCONFIG') as IJwtconfig;
  }

  private async generateToken(user: User) {
    const token = await this.jwtservice.signAsync(
      {
        sub: user.id,
        gmail: user.gmail,
        role: user.userRole,
        jti: randomUUID(),
      },
      {
        secret: this.jwtconfig.JWT_SECRET1,
      },
    );

    return {
      accessToken: token,
    };
  }

  private t(key: string, args?: Record<string, any>): string {
    return this.i18n.t(key, {
      lang: I18nContext.current()?.lang || 'en',
      args,
    });
  }

  async register(dto: CreateAuthDto) {
    const exists = await this.userRepo.findOne({ where: { gmail: dto.gmail } });

    if (exists) {
      throw new BadRequestException(this.t('auth.USER_ALREADY_EXISTS'));
    }

    const hashPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      name: dto.name,
      gmail: dto.gmail,
      password: hashPassword,
      age: dto.age,
      phone: dto.phone,
      accauntStatus: accauntSatus.ACTIVE,
      gmailStatus: EmailStatusEnum.NOT_VERIFIED,
    });

    await this.userRepo.save(user);

    const security = this.usersecurityRepo.create({
      user,
      temporaryBlock: 0,
      permanetlyBlock: false,
      totalAttemps: 0,
      temporaryBlockUntil: null,
    });
    await this.usersecurityRepo.save(security);

    if (user.gmail) {
      void this.senderservice
        .sendEmail({
          to: user.gmail,
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          subject: 'Login Message',
          template: 'login-message',
          context: {
            name: user.name || user.gmail || 'USER',
          },
        })
        .catch((error) => {
          console.error('Email sending failed:', error);
        });
    }

    const token = await this.generateToken(user);

    return {
      ...token,
      message: this.t('auth.REGISTER_SUCCESS', {
        name: user.name || user.gmail,
      }),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { gmail: dto.gmail },
      relations: { security: true },
    });

    if (!user) {
      throw new UnauthorizedException(this.t('auth.INCORRECT_CREDENTIALS'));
    }

    if (user.accauntStatus === accauntSatus.PERMANETLY_BLOCK) {
      throw new ForbiddenException(this.t('auth.PERMANENTLY_BANNED'));
    }

    let security = user.security;
    if (!security) {
      security = this.usersecurityRepo.create({
        user,
        temporaryBlock: 0,
        permanetlyBlock: false,
        totalAttemps: 0,
        temporaryBlockUntil: null,
      });
      await this.usersecurityRepo.save(security);
      user.security = security;
    }

    if (
      user.accauntStatus === accauntSatus.TEMPORARY_BLOCK &&
      security.temporaryBlockUntil
    ) {
      const now = new Date();
      if (now < security.temporaryBlockUntil) {
        const remaining = Math.ceil(
          (security.temporaryBlockUntil.getTime() - now.getTime()) / 60000,
        );
        throw new ForbiddenException(
          this.t('auth.TEMPORARILY_BLOCKED_REMAINING', { remaining }),
        );
      }

      user.accauntStatus = accauntSatus.ACTIVE;
      security.temporaryBlockUntil = null;
      await this.userRepo.save(user);
      await this.usersecurityRepo.save(security);
    }

    const passwordCompare = await bcrypt.compare(dto.password, user.password);

    if (!passwordCompare) {
      security.totalAttemps += 1;

      if (security.totalAttemps >= 3) {
        security.totalAttemps = 0;
        security.temporaryBlock += 1;

        const blockUntil = new Date(Date.now() + 15 * 60 * 1000);
        security.temporaryBlockUntil = blockUntil;
        user.accauntStatus = accauntSatus.TEMPORARY_BLOCK;

        await this.userRepo.save(user);
        await this.usersecurityRepo.save(security);

        if (security.temporaryBlock >= 5) {
          security.permanetlyBlock = true;
          user.accauntStatus = accauntSatus.PERMANETLY_BLOCK;
          await this.userRepo.save(user);
          await this.usersecurityRepo.save(security);
          throw new ForbiddenException(
            this.t('auth.PERMANENTLY_BLOCKED_ATTEMPTS'),
          );
        }

        throw new ForbiddenException(this.t('auth.TEMPORARILY_BLOCKED_15'));
      }

      await this.usersecurityRepo.save(security);
      throw new UnauthorizedException(this.t('auth.INCORRECT_CREDENTIALS'));
    }

    if (
      security.totalAttemps !== 0 ||
      security.temporaryBlockUntil !== null
    ) {
      security.totalAttemps = 0;
      security.temporaryBlockUntil = null;

      await this.usersecurityRepo.save(security);
    }

    if (user.accauntStatus !== accauntSatus.ACTIVE) {
      user.accauntStatus = accauntSatus.ACTIVE;

      await this.userRepo.save(user);
    }

    if (user.gmail) {
      try {
        void this.senderservice.sendEmail({
          to: user.gmail,
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          subject: 'Login Message',
          template: 'login-message',
          context: {
            name: user.name || user.gmail || 'USER',
          },
        });
      } catch (error) {
        console.error('Email sending failed:', error);
      }
    }

    const token = await this.generateToken(user);

    return {
      ...token,
      message: this.t('auth.LOGIN_SUCCESS', { name: user.name || user.gmail }),
    };
  }

  async sendVerifyCode(dto: sendVerifyCodeDto) {
    const user = await this.userRepo.findOne({
      where: {
        gmail: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException(this.t('auth.USER_NOT_FOUND'));
    }

    await this.secretCodeRepo.delete({
      user: {
        id: user.id,
      },
    });

    const generated = this.secretCodeRepo.create({
      code: randomCode().toString(),
      user,
      createdAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await this.secretCodeRepo.save(generated);

    void this.senderservice.sendEmail({
      to: user.gmail,
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      subject: 'Verify Email',
      template: 'verify-email',
      context: {
        name: user.name || user.gmail,
        code: generated.code,
        year: new Date().getFullYear(),
      },
    });

    return {
      message: this.t('auth.VERIFICATION_CODE_SENT'),
    };
  }

  async VerifyEmail(dto: VerifyEmailDto, userId:number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { secretCode: true },
    });

    if (!user) {
      throw new BadRequestException(this.t('auth.USER_NOT_FOUND'));
    }

    if (user.gmailStatus === EmailStatusEnum.VERIFIED) {
      throw new BadRequestException(this.t('auth.EMAIL_ALREADY_VERIFIED'));
    }

    const secret = await this.secretCodeRepo.findOne({
      where: { code: dto.code, user: { id: user.id } },
    });

    if (!secret) {
      throw new BadRequestException(this.t('auth.INVALID_VERIFICATION_CODE'));
    }

    if (secret.createdAt < new Date()) {
      await this.secretCodeRepo.delete({
        id: secret.id,
      });

      throw new BadRequestException(this.t('auth.VERIFICATION_CODE_EXPIRED'));
    }
    user.gmailStatus = EmailStatusEnum.VERIFIED;
    await this.userRepo.save(user);

    return { message: this.t('auth.EMAIL_VERIFIED', { email: user.gmail }) };
  }

  async forgetPassword(dto: forgetPasswordDto) {
    const user = await this.userRepo.findOne({ where: { gmail: dto.gmail } });

    if (!user) {
      throw new BadRequestException(this.t('auth.USER_NOT_FOUND'));
    }

    if (user.gmailStatus === EmailStatusEnum.NOT_VERIFIED) {
      throw new BadRequestException(this.t('auth.VERIFY_EMAIL_FIRST'));
    }

    await this.secretCodeRepo.delete({
      user: {
        id: user.id,
      },
    });

    const generated = this.secretCodeRepo.create({
      code: randomCode().toString(),
      user,
      createdAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (user.gmail) {
      void this.senderservice.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'noreply@example.com',
        subject: 'Change Password',
        template: 'forget-password',
        context: {
          name: user.gmail || user.name || 'USER',
          code: generated.code,
        },
      });
      await this.secretCodeRepo.save(generated);
    }

    return { message: this.t('auth.SECRET_CODE_SENT', { email: user.gmail }) };
  }

  async acceptChangePassword(dto: ChangedPassword) {
    const secret = await this.secretCodeRepo.findOne({
      where: { code: dto.code },
      relations: { user: true },
    });

    if (!secret || !secret.user) {
      throw new BadRequestException(this.t('auth.INVALID_CODE'));
    }

    const user = secret.user;

    const hashPassword = await bcrypt.hash(dto.newPassword, 10);
    user.password = hashPassword;

    await this.userRepo.save(user);

    await this.secretCodeRepo.remove(secret);

    if (user.gmail) {
      void this.senderservice.sendEmail({
        to: user.gmail,
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        subject: 'Password Changed',
        template: 'new-password',
        context: {
          name: user.gmail || user.name,
        },
      });

      return { message: this.t('auth.PASSWORD_CHANGED') };
    }
  }
  async logout(token: string) {
    const payload = await this.jwtservice.verifyAsync<JwtPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET1'),
    });

    if (!payload.jti || !payload.exp) {
      throw new UnauthorizedException('Invalid token');
    }

    const now = Math.floor(Date.now() / 1000);
    const ttl = payload.exp - now;

    if (ttl > 0) {
      await this.redisservice.set(`blacklist:token:${payload.jti}`, '1', ttl);
    }

    return {
      message: 'Logged out successfully',
    };
  }
}
