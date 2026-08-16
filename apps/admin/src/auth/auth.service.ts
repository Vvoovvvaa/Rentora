import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Admin, AdminSecretcode } from '@app/common-rentora/database/entity';
import { adminRoleEnum } from '@app/common-rentora/database/enums';
import { IJwtconfig } from '@app/common-rentora/models';
import { CreateAdminDto } from './dto/create-admin-dto';
import { LoginAdminDto } from './dto/login.dto';
import { SenderService } from '@app/common-rentora/smtp';
import { changeAdminPasswordDto } from './dto/change-password.dto';
import { SendCodeChangePasswordDto } from './dto/send-code-change-password';
import { randomCode } from '@app/common-rentora/helpers';
import { NewPassowrdDto } from './dto/new-password.dto';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class AdminAuthService {
    private readonly jwtconfig: IJwtconfig;

    constructor(
        @InjectRepository(Admin)
        private readonly adminrepo: Repository<Admin>,

        @InjectRepository(AdminSecretcode)
        private readonly secretCodeRepo: Repository<AdminSecretcode>,

        private readonly jwtservice: JwtService,
        private readonly configService: ConfigService,
        private readonly senderservice: SenderService,
        private readonly i18n: I18nService
    ) {
        this.jwtconfig =
            this.configService.get('JWTCONFIG') as IJwtconfig;
    }

    private t(key: string,args?: Record<string, any>,): string {
        return this.i18n.t(key, {
            lang: I18nContext.current()?.lang || 'am',
            args,
        }) as string;
    }

    private async generateToken(admin: Admin) {
        const token = await this.jwtservice.signAsync(
            {
                sub: admin.id,
                gmail: admin.gmail,
                role: admin.adminRole,
                type: 'ADMIN',
            },
        );

        return {
            accessToken: token,
        };
    }

    async loginAdmin(dto: LoginAdminDto) {
        const admin = await this.adminrepo.findOne({
            where: {
                gmail: dto.gmail,
            },
        });

        if (!admin) {
            throw new NotFoundException(
                this.t('adminAuth.ADMIN_NOT_FOUND')
            );
        }

        const isMatch = await bcrypt.compare(
            dto.password,
            admin.password,
        );

        if (!isMatch) {
            throw new BadRequestException(
                this.t('adminAuth.INCORRECT_CREDENTIALS')
            );
        }

        if (admin.gmail) {
            await this.senderservice.sendEmail({
                to: admin.gmail,
                from: process.env.SMTP_FROM || 'no-reply@example.com',
                subject: "Welcome Admin",
                template: 'admin-login-message',
                context: {
                    name: admin.name || admin.gmail,
                    year: new Date().getFullYear()
                }
            })
        }

        return await this.generateToken(admin);
    }

    async createAdmin(dto: CreateAdminDto, adminId: number,) {
        const superAdmin =
            await this.adminrepo.findOne({
                where: {
                    id: adminId,
                },
            });

        if (!superAdmin) {
            throw new BadRequestException(
                this.t('adminAuth.ADMIN_NOT_FOUND')
            );
        }

        if (superAdmin.adminRole !== adminRoleEnum.super_admin) {
            throw new ForbiddenException(
                this.t('adminAuth.ONLY_SUPER_ADMIN_CREATE')
            );
        }

        const exists =
            await this.adminrepo.findOne({
                where: {
                    gmail: dto.gmail,
                },
            });

        if (exists) {
            throw new BadRequestException(
                this.t('adminAuth.ADMIN_ALREADY_EXISTS')
            );
        }

        const password = await bcrypt.hash(
            dto.password,
            10,
        );

        const newAdmin =
            this.adminrepo.create({
                ...dto,
                password,
            });

        await this.adminrepo.save(newAdmin);

        return {
            message:
                this.t('adminAuth.ADMIN_CREATED', { name: newAdmin.name }),
        };
    }

    async changeAdminPassword(dto: changeAdminPasswordDto, adminId: number) {
        const admin = await this.adminrepo.findOne({
            where: { id: adminId },
        });

        if (!admin) {
            throw new BadRequestException(this.t('adminAuth.ADMIN_NOT_FOUND'))
        }

        const isMatch = await bcrypt.compare(
            dto.oldPassword,
            admin.password,
        );

        if (!isMatch) {
            throw new BadRequestException(this.t('adminAuth.INVALID_OLD_PASSWORD'))
        }

        if (dto.oldPassword === dto.newPassword) {
            throw new BadRequestException(
                this.t('adminAuth.NEW_PASSWORD_MUST_BE_DIFFERENT'),
            );
        }

        const samePassword = await bcrypt.compare(dto.newPassword, admin.password)

        if (samePassword) {
            throw new BadRequestException(
                this.t('adminAuth.NEW_PASSWORD_MUST_BE_DIFFERENT')
            );
        }

        admin.password = await bcrypt.hash(
            dto.newPassword,
            10,
        );

        await this.adminrepo.save(admin)


        if (admin.gmail) {
            await this.senderservice.sendEmail({
                to: admin.gmail,
                from: process.env.SMTP_FROM || "no-reply@Renotra.com",
                subject: 'Password Succesfuly changed',
                template: 'admin-password',
                context: {
                    name: admin.name || admin.gmail,
                    year: new Date().getFullYear(),
                }
            })
        }

        const superAdminEmail = process.env.SUPER_ADMIN;

        if (superAdminEmail) {
            await this.senderservice.sendEmail({
                to: superAdminEmail,
                from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
                subject: 'Renotra Admin changed password',
                template: 'admin-password',
                context: {
                    adminName: admin.name,
                    adminEmail: admin.gmail,
                    role: admin.adminRole,
                    changedAt: new Date().toLocaleString(),
                    year: new Date().getFullYear(),
                }
            })
        }

        return {
            message: this.t('adminAuth.PASSWORD_CHANGED'),
        };
    }

    async SendCodeforgetPassword(dto: SendCodeChangePasswordDto) {
        const admin = await this.adminrepo.findOne({ where: { gmail: dto.gmail } })

        if (!admin) {
            throw new BadRequestException(this.t('adminAuth.TRY_AGAIN_LATER'))
        }

        await this.secretCodeRepo.delete({
            admin: { id: admin.id }
        })

        const generated = this.secretCodeRepo.create({
            code: randomCode().toString(),
            admin: admin,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        })
        await this.secretCodeRepo.save(generated)

        if (admin.gmail) {
            await this.senderservice.sendEmail({
                to: admin.gmail,
                from: process.env.SMTP_FROM || 'no-replyRenotra.com',
                subject: 'Verifiaction Code',
                template: 'forget-password',
                context: {
                    name: admin.name || admin.gmail,
                    code: generated.code,
                    year: new Date().getFullYear()
                }

            })
        }

        return { message: this.t('adminAuth.SECRET_CODE_SENT', { email: admin.gmail }) }

    }

    async acceptNewpassword(dto: NewPassowrdDto) {
        const secret = await this.secretCodeRepo.findOne({ where: { code: dto.code }, relations: { admin: true } })

        if (!secret || !secret.admin) {
            throw new BadRequestException(this.t('adminAuth.INVALID_CREDENTIALS'))
        }

        if (secret.expiresAt < new Date()) {
            await this.secretCodeRepo.remove(secret);

            throw new BadRequestException(
                this.t('adminAuth.VERIFICATION_CODE_EXPIRED')
            );
        }

        const admin = secret.admin

        const hashPassword = await bcrypt.hash(dto.newPassword, 10)
        admin.password = hashPassword

        const samePassword = await bcrypt.compare(dto.newPassword, admin.password)

        if (samePassword) {
            throw new BadRequestException(
                this.t('adminAuth.NEW_PASSWORD_MUST_BE_DIFFERENT_PREVIOUS')
            );
        }

        await this.adminrepo.save(admin)
        await this.secretCodeRepo.remove(secret)

        if (admin.gmail) {
            await this.senderservice.sendEmail({
                to: admin.gmail,
                from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
                subject: 'Password Changed',
                template: 'admin-password',
                context: {
                    name: admin.name || admin.gmail,
                    year: new Date().getFullYear()
                }
            })
        }

        const SuperGmail = process.env.SUPER_ADMIN

        if (SuperGmail) {
            await this.senderservice.sendEmail({
                to: SuperGmail,
                from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
                subject: 'Admin Changed Password',
                template: 'admin-password',
                context: {
                    adminName: admin.name,
                    adminEmail: admin.gmail,
                    role: admin.adminRole,
                    changedAt: new Date().toLocaleString(),
                    year: new Date().getFullYear(),
                }
            })
        }

        return { message: this.t('adminAuth.PASSWORD_CHANGED') }

    }
}