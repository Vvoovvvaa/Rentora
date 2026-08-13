import { Admin, Property, Support, User } from "@app/common-rentora/database/entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([User,Support])
    ],
    controllers: [],
    providers: []
})
export class SupportAdminModule{}