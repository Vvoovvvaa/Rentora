import { AgencyVerifyRejectionReason } from "@app/common-rentora/enums";
import { IsEnum, IsNotEmpty } from "class-validator";

export class deleteagencyDto{
    @IsNotEmpty()
    @IsEnum(AgencyVerifyRejectionReason)
    deleteReason:AgencyVerifyRejectionReason
}