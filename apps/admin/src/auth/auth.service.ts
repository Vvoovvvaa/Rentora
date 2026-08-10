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
        private readonly senderservice: SenderService
    ) {
        this.jwtconfig =
            this.configService.get('JWTCONFIG') as IJwtconfig;
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
                'Admin not found'
            );
        }

        const isMatch = await bcrypt.compare(
            dto.password,
            admin.password,
        );

        if (!isMatch) {
            throw new BadRequestException(
                'Incorrect email or password'
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
                'Admin not found'
            );
        }

        if (superAdmin.adminRole !== adminRoleEnum.super_admin) {
            throw new ForbiddenException(
                'Only super admin can create admins'
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
                'Admin with this email already exists'
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
                `Admin ${newAdmin.name} successfully created`,
        };
    }

    async changeAdminPassword(dto: changeAdminPasswordDto, adminId: number) {
        const admin = await this.adminrepo.findOne({
            where: { id: adminId },
        });

        if (!admin) {
            throw new BadRequestException('Admin not found')
        }

        const isMatch = await bcrypt.compare(
            dto.oldPassword,
            admin.password,
        );

        if (!isMatch) {
            throw new BadRequestException('Invalid old password')
        }

        if (dto.oldPassword === dto.newPassword) {
            throw new BadRequestException(
                'New password must be different from old password',
            );
        }

        const samePassword = await bcrypt.compare(dto.newPassword, admin.password)

        if (samePassword) {
            throw new BadRequestException(
                'New password must be different from old password'
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
            message: 'Password successfully changed',
        };
    }

    async SendCodeforgetPassword(dto: SendCodeChangePasswordDto) {
        const admin = await this.adminrepo.findOne({ where: { gmail: dto.gmail } })

        if (!admin) {
            throw new BadRequestException('please try again later')
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

        return { message: `secret code sended in ${admin.gmail}` }

    }

    async acceptNewpassword(dto: NewPassowrdDto) {
        const secret = await this.secretCodeRepo.findOne({ where: { code: dto.code }, relations: { admin: true } })

        if (!secret || !secret.admin) {
            throw new BadRequestException('ivalid credentials, try again')
        }

        if (secret.expiresAt < new Date()) {
            await this.secretCodeRepo.remove(secret);

            throw new BadRequestException(
                'Verification code expired'
            );
        }

        const admin = secret.admin

        const hashPassword = await bcrypt.hash(dto.newPassword, 10)
        admin.password = hashPassword

        const samePassword = await bcrypt.compare(dto.newPassword, admin.password)

        if (samePassword) {
            throw new BadRequestException(
                'New password must be different from previous password'
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

        return { message: "password succefuly changed" }

    }
}