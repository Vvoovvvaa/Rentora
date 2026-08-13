import { Support, User } from "@app/common-rentora/database/entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Support])
    ],
    controllers: [SupportController],
    providers: [SupportService]
})
export class SupportModule { }