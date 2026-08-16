import { AuthUser } from "@app/common-rentora/decorators";
import { Body, Controller, Get, Param, ParseEnumPipe, Post, Query, UseGuards } from "@nestjs/common";
import { SupportAdminservice } from "./support.service";
import { AdminAuthGuard } from "@app/common-rentora/guard";
import { SupportStatusEnum } from "@app/common-rentora/database/enums/support-status";
import { adminAnswerDto } from "./dto/admin-answer.dto";

@Controller('support-admin')
@UseGuards(AdminAuthGuard)
export class SupportAdminController {
    constructor(
        private readonly supportService: SupportAdminservice
    ) { }

    @Get()
    viewallSupports(@AuthUser('id') adminId: number) {
        return this.supportService.viewAllSupports(adminId)
    }

    @Post(":id")
    viewOneSupport(@AuthUser('id') adminId: number, @Param('id') supportId: number) {
        return this.supportService.viewOneSupport(adminId, supportId)
    }

    @Post("accept/:id")
    acceptSupport(@AuthUser('id') adminId: number, @Param('id') supportId: number) {
        return this.supportService.acceptSupport(adminId, supportId)
    }

    @Post('close/:id')
    closeSupport(@AuthUser('id') adminId: number, @Param('id') supportId: number) {
        return this.supportService.closeSupport(adminId, supportId)
    }

    @Get('status')
    viewSupportsByStatus(@AuthUser('id') adminId: number, @Query('status', new ParseEnumPipe(SupportStatusEnum)) status: SupportStatusEnum) {
        return this.supportService.viewSupportsByStatus(adminId, status)
    }

    @Post('response/:id')
    adminResponse(@AuthUser('id') adminId: number, @Param('id') supportId: number, @Body() body: adminAnswerDto) {
        return this.supportService.adminResponse(adminId, supportId, body)
    }
}