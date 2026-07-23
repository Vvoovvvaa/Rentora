import { PropertyStatus, PropertyCategory } from "@app/common-rentora/database/enums"
import { PropertyCurrency } from "@app/common-rentora/database/enums/property-currency"
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min, MinLength } from "class-validator"

export class CreatePropertyDto {
    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    @MinLength(30)
    description: string

    @IsNotEmpty()
    @IsEnum(PropertyCategory)
    category: PropertyCategory

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    price: number

    @IsNotEmpty()
    @IsEnum(PropertyCurrency)
    currency: PropertyCurrency

}
