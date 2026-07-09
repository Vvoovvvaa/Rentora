import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from "bcrypt"

import { LoginDto } from './dto/login.dto';
import { CreateAuthDto } from './dto/auth.dto';
import { IJwtconfig } from '@app/common-rentora/models/jwt.config';
import { User } from '@app/common-rentora/database/entity';


@Injectable()
export class AuthService {
    private jwtconfig: IJwtconfig

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        private readonly jwtservice: JwtService,
        private readonly configService: ConfigService,

    ) {
        this.jwtconfig = this.configService.get("JWTCONFIG") as IJwtconfig
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
        let exists = await this.userRepo.findOne({ where: { gmail: dto.gmail } })

        if (exists) {
            throw new ConflictException("user already exists")
        }

        const hashPassword = await bcrypt.hash(
            dto.password, 10
        )

        const user = this.userRepo.create({
            name: dto.name,
            gmail: dto.gmail,
            password: hashPassword,
            age: dto.age,
            phone: dto.phone

        })

        await this.userRepo.save(user)
        return this.generateToken(user)
    }

    async login(dto: LoginDto) {
        let user = await this.userRepo.findOne({ where: { gmail: dto.gmail } })

        if (!user) {
            throw new UnauthorizedException("Inccorect Gmail or password, please try again")
        }

        const passwordCompare = await bcrypt.compare(
            dto.password,
            user.password
        )

        if (!passwordCompare) {
            throw new UnauthorizedException("inccorect email or password")
        }
        return this.generateToken(user)


    }
}
