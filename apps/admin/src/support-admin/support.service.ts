import { Admin, Support } from "@app/common-rentora/database/entity";
import { SupportStatusEnum } from "@app/common-rentora/database/enums/support-status";
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { adminAnswerDto } from "./dto/admin-answer.dto";

@Injectable()
export class SupportAdminservice {
    constructor(

        @InjectRepository(Admin)
        private readonly adminRepo: Repository<Admin>,

        @InjectRepository(Support)
        private readonly supportRepo: Repository<Support>
    ) { }

    async viewAllSupports(adminId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        return this.supportRepo.find({ relations: { user: true } })
    }

    async viewOneSupport(adminId: number, supportId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const support = await this.supportRepo.findOne({ where: { id: supportId }, relations: { user: true } })

        if (!support) {
            throw new BadRequestException("Please try again later")
        }

        support.admin = admin
        support.status = SupportStatusEnum.OPEN

        return support
    }

    async acceptSupport(adminId: number, supportId: number) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const support = await this.supportRepo.findOne({ where: { id: supportId }, relations: { user: true } })

        if (!support) {
            throw new BadRequestException("Please try again later")
        }

        if (support.status === SupportStatusEnum.OPEN) {
            throw new BadRequestException('Support already accepted')
        }

        support.status = SupportStatusEnum.OPEN
        support.admin = admin

        await this.supportRepo.save(support)

        return { message: "Support ticket successfully accepted", support }

    }

    async closeSupport(adminId: number, supportId: number) {
        const admin = await this.adminRepo.findOne({
            where: { id: adminId }
        })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const support = await this.supportRepo.findOne({
            where: {
                id: supportId
            }
        })

        if (!support) {
            throw new BadRequestException("Support ticket not found")
        }

        if (support.status === SupportStatusEnum.CLOSED) {
            throw new BadRequestException(
                "Support ticket is already closed"
            )
        }

        support.status = SupportStatusEnum.CLOSED

        await this.supportRepo.save(support)
        support.admin = admin

        return {
            message: "Support ticket successfully closed"
        }
    }

    async viewSupportsByStatus(adminId: number, status: SupportStatusEnum) {
        const admin = await this.adminRepo.findOne({
            where: { id: adminId }
        })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        return await this.supportRepo.find({ where: { status }, relations: { user: true }, order: { createdAt: "DESC" } })
    }


    async adminResponse(adminId: number, supportId: number, dto: adminAnswerDto) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } })

        if (!admin) {
            throw new BadRequestException("Please try again later")
        }

        const support = await this.supportRepo.findOne({ where: { id: supportId }, relations: { user: true, admin: true } })

        if (!support) {
            throw new BadRequestException("Support ticket not found")
        }

        if (support.status === SupportStatusEnum.CLOSED) {
            throw new BadRequestException(
                'Support ticket is already closed'
            )
        }

        support.adminRespone = dto.message
        support.admin = admin
        support.status = SupportStatusEnum.CLOSED
        await this.supportRepo.save(support)

        return {message: " support ticket succefuly answered"}

    }
}