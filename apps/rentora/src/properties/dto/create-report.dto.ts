import { ReportStatusEnum } from "@app/common-rentora/database/enums";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class CreateReportDto {
    @IsEnum(ReportStatusEnum)
    @IsNotEmpty()
    report: ReportStatusEnum

    @IsString()
    @IsNotEmpty()
    description: string

}