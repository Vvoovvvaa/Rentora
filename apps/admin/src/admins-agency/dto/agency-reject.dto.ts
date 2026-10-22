import { AgencyVerifyRejectionReason } from "@app/common-rentora";
import { IsEnum } from "class-validator";

export class RejectAgencyDto{
    @IsEnum(AgencyVerifyRejectionReason)
    reason: AgencyVerifyRejectionReason
}