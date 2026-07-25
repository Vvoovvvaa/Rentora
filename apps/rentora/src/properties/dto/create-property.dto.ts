import { PropertyCategory, ArmeniaCity } from "@app/common-rentora/database/enums"
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

    @IsEnum(ArmeniaCity)
    @IsNotEmpty()
    city: ArmeniaCity

    @IsNotEmpty()
    @IsEnum(PropertyCategory)
    category: PropertyCategory

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    price: number

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    rooms: number

    @IsNotEmpty()
    @IsNumber()
    @Min(5)
    area: number

    @IsNotEmpty()
    @IsEnum(PropertyCurrency)
    currency: PropertyCurrency

}
