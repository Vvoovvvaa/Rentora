import { ArmeniaCity, PropertyCategory, PropertySort } from "@app/common-rentora/database/enums";
import { Type } from "class-transformer";
import { IsEnum, isNumber, IsNumber, IsOptional, Min } from "class-validator";

export class SearchDto{
    @IsEnum(ArmeniaCity)
    @IsOptional()
    city?: ArmeniaCity

    @IsEnum(PropertyCategory)
    @IsOptional()
    category?: PropertyCategory 

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(1)
    minPrice?:number

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    maxPrice?: number

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    rooms?: number

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    area?: number

    @IsEnum(PropertySort)
    @IsOptional()
    sort: PropertySort

}