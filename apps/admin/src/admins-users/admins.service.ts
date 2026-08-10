import { Property, User, Admin, UserSecurity } from '@app/common-rentora/database/entity';
import { SenderService } from '@app/common-rentora/smtp';
import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { accauntSatus } from '@app/common-rentora/database/enums';

@Injectable()
export class AdminsService {
    constructor(
        @InjectRepository(Admin)
        private readonly adminRepo: Repository<Admin>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(UserSecurity)
        private readonly usersecurtyrepo: Repository<UserSecurity>,

        @InjectRepository(Property)
        private readonly propertyRepo: Repository<Property>,

        private readonly senderService: SenderService
    ){}

    async viewUsers(){
        return this.userRepo.find()
    }

    async blockUser(userid: number, adminId: number){
        const admin = await this.adminRepo.findOne({where: {id: adminId }})

        if(!admin){
            throw new BadRequestException('please try again later')
        }

        const user = await this.userRepo.findOne({where: {id: userid}})

        if(!user){
            throw new BadRequestException("user not found")
        }

        const userSecurity = await this.usersecurtyrepo.findOne({where: {user: {id: user.id}}})

        if(!userSecurity){
            throw new BadRequestException("please try again later")
        }

        if(user.accauntStatus === accauntSatus.PERMANETLY_BLOCK){
            throw new BadRequestException('User already blocket')
        }

        user.accauntStatus = accauntSatus.PERMANETLY_BLOCK
        await this.userRepo.save(user)

        return {message: `user - ${user.name} succesfuly blocket `}

    }

}
