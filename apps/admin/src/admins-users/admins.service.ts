import { Property, User, Admin, UserSecurity } from '@app/common-rentora/database/entity';
import { SenderService } from '@app/common-rentora/smtp';
import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { accauntSatus, adminRoleEnum } from '@app/common-rentora/database/enums';
import { findUserDto } from './dto/user-find.dto';

@Injectable()
export class AdminsService {
    constructor(
        @InjectRepository(Admin)
        private readonly adminRepo: Repository<Admin>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(UserSecurity)
        private readonly usersecurtyrepo: Repository<UserSecurity>,

        private readonly senderService: SenderService
    ) { }

    async viewUsers() {
        return this.userRepo.find()
    }

    async findOneUser(userId: number, adminId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException('please try again later')
        }

        const user = await this.userRepo.findOne({ where: { id: userId }, relations: { properties: true, security: true } })

        if (!user) {
            throw new BadRequestException("user not found")
        }

        return user


    }

    async blockUser(userid: number, adminId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException('please try again later')
        }

        const user = await this.userRepo.findOne({ where: { id: userid } })

        if (!user) {
            throw new BadRequestException("user not found")
        }

        const userSecurity = await this.usersecurtyrepo.findOne({ where: { user: { id: user.id } } })

        if (!userSecurity) {
            throw new BadRequestException("please try again later")
        }

        if (user.accauntStatus === accauntSatus.PERMANETLY_BLOCK) {
            throw new BadRequestException('User already blocket')
        }

        user.accauntStatus = accauntSatus.PERMANETLY_BLOCK
        await this.userRepo.save(user)

        if (user.gmail) {
            await this.senderService.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
                subject: 'Your accaunt are blocked',
                template: 'block-user',
                context: {
                    name: user.name || user.gmail,
                    year: new Date().getFullYear()
                }
            })
        }

        return { message: `user - ${user.name} succesfuly blocket ` }

    }

    async unBlockUser(userId: number, adminId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } })

        if (!user) {
            throw new BadRequestException('Please try again later')
        }

        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        if (user.accauntStatus === accauntSatus.ACTIVE) {
            throw new BadRequestException("User is not Blcoked")
        }

        user.accauntStatus = accauntSatus.ACTIVE
        await this.userRepo.save(user)

        if (user.gmail) {
            await this.senderService.sendEmail({
                to: user.gmail,
                from: process.env.SMTP_FROM || 'no-reply@Renotra.com',
                subject: 'Your accaunt are Unblocked',
                template: 'unBlock-user',
                context: {
                    name: user.name || user.gmail,
                    year: new Date().getFullYear()
                }
            })
        }

        return { message: `${user.name} succesfuly unblocked by admin ${admin.name}` }
    }

    async findUserByQuery(
        dto: findUserDto,
        adminId: number
    ) {
        const admin = await this.adminRepo.findOne({
            where: {
                id: adminId
            }
        });

        if (!admin) {
            throw new BadRequestException(
                'Admin not found'
            );
        }

        const query = this.userRepo
            .createQueryBuilder('user');

        if (dto.name) {
            query.andWhere(
                'user.name ILIKE :name',
                {
                    name: `%${dto.name}%`
                }
            );
        }

        if (dto.gmail) {
            query.andWhere(
                'user.gmail ILIKE :gmail',
                {
                    gmail: `%${dto.gmail}%`
                }
            );
        }

        if (dto.phone) {
            query.andWhere(
                'user.phone ILIKE :phone',
                {
                    phone: `%${dto.phone}%`
                }
            );
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
            }
        })

        if (!admin) {
            throw new BadRequestException('Admin not found')
        }

        return admin
    }

    async findeOneAdmin(adminId: number, searchAdmin: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Admin not found")
        }

        const search = await this.adminRepo.findOne({ where: { id: searchAdmin } })

        if (!search) {
            throw new BadRequestException("Admin not found")
        }

        return search
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
            }
        })
    }


    async deleteAdmin(adminId: number, deltedId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Admin not found")
        }

        const deleted = await this.adminRepo.findOne({ where: { id: deltedId } })

        if (!deleted) {
            throw new BadRequestException("Admin not found")
        }

        if (adminId === deltedId) {
            throw new BadRequestException(
                'You cannot delete your own admin account'  
            )
        }

        if (admin.adminRole !== adminRoleEnum.super_admin) {
            throw new BadRequestException('only super admin can delete admins')
        }

        await this.adminRepo.remove(deleted)

        return { message: ` admin - ${deleted.name} succesfuly deleted by admin - ${admin.name}` }

    }
}
