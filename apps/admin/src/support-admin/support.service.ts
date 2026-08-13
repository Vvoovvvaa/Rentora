import { Support, User } from "@app/common-rentora/database/entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class SupportAdminservice {
    constructor(

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Support)
        private readonly supportRepo: Repository<Support>
    ){}

    async createSupport(userId:number){}

}