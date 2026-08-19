import {
    ArmeniaCity,
    BuildingType,
    PropertyCategory,
    PropertyCondition,
    PropertyCurrency,
    PropertyFeature,
    propertyListing,
    PropertySort,
} from '@app/common-rentora/enums';

import {
    Transform,
    Type,
} from 'class-transformer';

import {
    IsArray,
    IsEnum,
    IsNumber,
    IsOptional,
    Min,
} from 'class-validator';

export class SearchDto {
    @IsOptional()
    @IsEnum(ArmeniaCity)
    city?: ArmeniaCity;

    @IsOptional()
    @IsEnum(PropertyCategory)
    category?: PropertyCategory;

    @IsOptional()
    @IsEnum(propertyListing)
    listing?: propertyListing;

    @IsOptional()
    @IsEnum(PropertyCurrency)
    currency?: PropertyCurrency;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    rooms?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    bedrooms?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    bathrooms?: number;

    // Старый точный фильтр
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    area?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    minArea?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxArea?: number;

    // Старый точный фильтр
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    floor?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    minFloor?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxFloor?: number;

    // Старый точный фильтр
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    constructionYear?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    minConstructionYear?: number;

    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    maxConstructionYear?: number;

    @IsOptional()
    @IsEnum(PropertyCondition)
    condition?: PropertyCondition;

    @IsOptional()
    @IsEnum(BuildingType)
    buildingType?: BuildingType;


    //For AI
    @Transform(({ value }) => {
        if (value === undefined || value === null) {
            return value;
        }

        if (Array.isArray(value)) {
            return value;
        }

        return String(value)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    })
    @IsOptional()
    @IsArray()
    @IsEnum(PropertyFeature, {
        each: true,
    })
    features?: PropertyFeature[];

    @IsOptional()
    @IsEnum(PropertySort)
    sort?: PropertySort;
}