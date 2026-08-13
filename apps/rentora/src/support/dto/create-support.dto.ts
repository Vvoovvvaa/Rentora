import { supportTicketEnum } from "@app/common-rentora/database/enums";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class CreateSupportDto{
    @IsNotEmpty()
    @IsString()
    subject: string

    @IsNotEmpty()
    @IsString()
    message: string

    @IsEnum(supportTicketEnum)
    @IsNotEmpty()
    ticket: supportTicketEnum


}
