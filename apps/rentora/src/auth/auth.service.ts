import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from "bcrypt";

import { LoginDto } from './dto/login.dto';
import { CreateAuthDto } from './dto/auth.dto';
import { IJwtconfig } from '@app/common-rentora/models/jwt.config';
import { User, Usersecurity } from '@app/common-rentora/database/entity';
import { accauntSatus } from '@app/common-rentora/database/enums/accaunt-status';

@Injectable()
export class AuthService {
    private jwtconfig: IJwtconfig;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Usersecurity)
        private readonly usersecurityRepo: Repository<Usersecurity>,

        private readonly jwtservice: JwtService,
        private readonly configService: ConfigService,
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
        let exists = await this.userRepo.findOne({ where: { gmail: dto.gmail } });

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
            accauntStatus: accauntSatus.ACTIVE 
        });

        await this.userRepo.save(user);
        return this.generateToken(user);
    }

    async login(dto: LoginDto) {
        let user = await this.userRepo.findOne({ 
            where: { gmail: dto.gmail },
            relations: {security: true} 
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

        return this.generateToken(user);
    }
}