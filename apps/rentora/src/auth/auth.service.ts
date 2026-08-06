import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from "bcrypt";

import { LoginDto } from './dto/login.dto';
import { CreateAuthDto } from './dto/auth.dto';
import { IJwtconfig } from '@app/common-rentora/models/jwt.config';
import { EmailStatusEnum, SecretCode, User, UserSecurity } from '@app/common-rentora/database/entity';
import { accauntSatus } from '@app/common-rentora/database/enums/accaunt-status';
import { SenderService } from '@app/common-rentora/smtp';
import { randomCode } from '@app/common-rentora/helpers';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { forgetPasswordDto } from './dto/forget.dto';
import { ChangedPassword } from './dto/acceptchangePassword.dto';
import { sendVerifyCodeDto } from './dto/sendverifyCode.dto';

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
        private readonly configService: ConfigService,
        private readonly senderservice: SenderService
    ) {
        this.jwtconfig = this.configService.get("JWTCONFIG") as IJwtconfig;
    }

    private async generateToken(user: User) {
        const token = await this.jwtservice.signAsync(
            {
                sub: user.id,
                gmail: user.gmail,
                role: user.userRole
            },
            {
                secret: this.jwtconfig.JWT_SECRET1
            }
        );

        return {
            accessToken: token
        };
    }

    async register(dto: CreateAuthDto) {
        const exists = await this.userRepo.findOne({ where: { gmail: dto.gmail } });

        if (exists) {
            throw new ConflictException("user already exists");
        }

        const hashPassword = await bcrypt.hash(dto.password, 10);

        const user = this.userRepo.create({
            name: dto.name,
            gmail: dto.gmail,
            password: hashPassword,
            age: dto.age,
            phone: dto.phone,
            accauntStatus: accauntSatus.ACTIVE,
            gmailStatus: EmailStatusEnum.NOT_VERIFIED
        });

        await this.userRepo.save(user);

        const security = this.usersecurityRepo.create({
            user,
            temporaryBlock: 0,
            permanetlyBlock: false,
            totalAttemps: 0,
            temporaryBlockUntil: null
        });
        await this.usersecurityRepo.save(security);

        if (user.gmail) {
            try {
                await this.senderservice.sendEmail({
                    to: user.gmail,
                    from: process.env.SMTP_FROM || "no-reply@example.com",
                    subject: "welcome message!",
                    template: "welcome-message",
                    context: {
                        name: user.name || user.gmail || "USER"
                    }
                });
            } catch (error) {
                console.error("Email sending failed:", error);
            }
        }

        const token = await this.generateToken(user);

        return {
            ...token,
            message: `User ${user.name || user.gmail} successfully registered`,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.userRepo.findOne({
            where: { gmail: dto.gmail },
            relations: { security: true }
        });

        if (!user) {
            throw new UnauthorizedException("Incorrect Gmail or password, please try again");
        }

        if (user.accauntStatus === accauntSatus.PERMANETLY_BLOCK) {
            throw new ForbiddenException("Your account has been permanently banned");
        }

        let security = user.security;
        if (!security) {
            security = this.usersecurityRepo.create({
                user,
                temporaryBlock: 0,
                permanetlyBlock: false,
                totalAttemps: 0,
                temporaryBlockUntil: null
            });
            await this.usersecurityRepo.save(security);
            user.security = security;
        }

        if (user.accauntStatus === accauntSatus.TEMPORARY_BLOCK && security.temporaryBlockUntil) {
            const now = new Date();
            if (now < security.temporaryBlockUntil) {
                const remaining = Math.ceil((security.temporaryBlockUntil.getTime() - now.getTime()) / 60000);
                throw new ForbiddenException(`Your account is temporarily blocked. You can try again in ${remaining} minute(s)`);
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
                    throw new ForbiddenException("Your account is permanently blocked due to too many failed attempts");
                }

                throw new ForbiddenException("Your account is temporarily blocked for 15 minutes");
            }

            await this.usersecurityRepo.save(security);
            throw new UnauthorizedException("Incorrect Gmail or password, please try again");
        }

        security.totalAttemps = 0;
        security.temporaryBlockUntil = null;
        user.accauntStatus = accauntSatus.ACTIVE;

        await this.usersecurityRepo.save(security);
        await this.userRepo.save(user);

        if (user.gmail) {
            try {
                await this.senderservice.sendEmail({
                    to: user.gmail,
                    from: process.env.SMTP_FROM || "no-reply@example.com",
                    subject: 'Login Message',
                    template: 'login-message',
                    context: {
                        name: user.name || user.gmail || 'USER'
                    }
                });
            } catch (error) {
                console.error("Email sending failed:", error);
            }
        }

        const token = await this.generateToken(user);

        return {
            ...token,
            message: `User ${user.name || user.gmail} successfully logged in`,
        };
    }

   async sendVerifyCode(dto: sendVerifyCodeDto) {
    const user = await this.userRepo.findOne({
        where: {
            gmail: dto.email,
        },
    });

    if (!user) {
        throw new NotFoundException('User not found');
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

    await this.senderservice.sendEmail({
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
        message: 'Verification code sent successfully',
    };
}

    async VerifyEmail(dto: VerifyEmailDto) {
        let user = await this.userRepo.findOne(
            {
                where: { gmail: dto.gmail },
                relations: { secretCode: true }
            })

        if (!user) {
            throw new BadRequestException("User not found")
        }

        if (user.gmailStatus === EmailStatusEnum.VERIFIED) {
            throw new BadRequestException("your email already verified")
        }

        const secret = await this.secretCodeRepo.findOne({ where: { code: dto.code, user: { id: user.id } } })

        if (!secret) {
            throw new BadRequestException("Invalid Verification Code")
        }

        if (secret.createdAt < new Date()) {
            await this.secretCodeRepo.delete({
                id: secret.id
            });

            throw new BadRequestException(
                "Verification code expired"
            );
        }
        user.gmailStatus = EmailStatusEnum.VERIFIED
        await this.userRepo.save(user)

        return { message: `Congratulations ${user.gmail}, your email Verified` }
    }

    async forgetPassword(dto: forgetPasswordDto) {
        let user = await this.userRepo.findOne({ where: { gmail: dto.gmail } })

        if (!user) {
            throw new BadRequestException("User Not Found")
        }

        if (user.gmailStatus === EmailStatusEnum.NOT_VERIFIED) {
            throw new BadRequestException("Please verified you Email")
        }

        await this.secretCodeRepo.delete({
            user: {
                id: user.id
            }
        });

        const generated = await this.secretCodeRepo.create({
            code: randomCode().toString(),
            user,
            createdAt: new Date(Date.now() + 10 * 60 * 1000)
        })


        if (user.gmail) {
            await this.senderservice.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || "noreply@example.com",
                subject: 'Change Password',
                template: 'forget-password',
                context: {
                    name: user.gmail || user.name || "USER",
                    code: generated.code
                }
            })
            await this.secretCodeRepo.save(generated);
        }

        return { message: `secret code sended in ${user.gmail}` }


    }

    async acceptChangePassword(dto: ChangedPassword) {
        const secret = await this.secretCodeRepo.findOne({
            where: { code: dto.code },
            relations: { user: true }
        });

        if (!secret || !secret.user) {
            throw new BadRequestException("Invalid Code");
        }

        const user = secret.user;

        const hashPassword = await bcrypt.hash(dto.newPassword, 10);
        user.password = hashPassword;

        await this.userRepo.save(user);

        await this.secretCodeRepo.remove(secret);

        if (user.gmail) {
            await this.senderservice.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || "no-reply@example.com",
                subject: 'Password Changed',
                template: 'new-password',
                context: {
                    name: user.gmail || user.name,
                }
            })

            return { message: "Password changed successfully" };
        }
    }
}