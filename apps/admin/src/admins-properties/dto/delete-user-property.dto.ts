import { PropertyDeleteReasonEnum } from "@app/common-rentora/enums/property-delete-reason";
import { IsEnum, IsNotEmpty } from "class-validator";

export class deleteUserPropertyDto{

    @IsEnum(PropertyDeleteReasonEnum)
    @IsNotEmpty()
    reason: PropertyDeleteReasonEnum
}