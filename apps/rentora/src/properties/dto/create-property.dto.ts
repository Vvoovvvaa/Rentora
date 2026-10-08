import {
  PropertyCategory,
  ArmeniaCity,
  PropertyFeature,
  PropertyCondition,
  BuildingType,
  propertyListing,
} from '@app/common-rentora/enums';

import { PropertyCurrency } from '@app/common-rentora/enums/property-currency';

import {
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  description: string;

  @IsEnum(ArmeniaCity)
  @IsNotEmpty()
  city: ArmeniaCity;

  @IsNotEmpty()
  @IsEnum(PropertyCategory)
  category: PropertyCategory;

  @IsNotEmpty()
  @IsEnum(propertyListing)
  listing: propertyListing;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  price: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  rooms: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(5)
  area: number;

  @IsNotEmpty()
  @IsEnum(PropertyCurrency)
  currency: PropertyCurrency;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  floor?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalFloors?: number;

  @IsOptional()
  @IsNumber()
  @Min(1.5)
  @Max(10)
  ceilingHeight?: number;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear() + 10)
  constructionYear?: number;

  @IsOptional()
  @IsEnum(PropertyCondition)
  condition?: PropertyCondition;

  @IsOptional()
  @IsEnum(BuildingType)
  buildingType?: BuildingType;

  @IsOptional()
  @IsArray()
  @IsEnum(PropertyFeature, { each: true })
  features?: PropertyFeature[];

  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  address: string;

  @IsLatitude()
  @IsNotEmpty()
  latitude: number;

  @IsLongitude()
  @IsNotEmpty()
  longitude: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  agencyId?: number;
}
