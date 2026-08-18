import {
  ArmeniaCity,
  PropertyCategory,
  PropertyCurrency,
  PropertyFeature,
  propertyListing,
  PropertySort,
} from '@app/common-rentora/enums';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class SearchDto {
  @IsEnum(ArmeniaCity)
  @IsOptional()
  city?: ArmeniaCity;

  @IsEnum(PropertyCategory)
  @IsOptional()
  category?: PropertyCategory;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  minPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  rooms?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  area?: number;

  @IsEnum(PropertySort)
  @IsOptional()
  sort: PropertySort;

  @IsOptional()
  @IsNumber()
  bedrooms: number;

  @IsOptional()
  @IsNumber()
  floor: number;

  @IsOptional()
  @IsNumber()
  constructionYear: number;

  @IsEnum(PropertyFeature)
  @IsOptional()
  features: PropertyFeature;

  @IsEnum(PropertyCurrency)
  @IsOptional()
  currency: PropertyCurrency;

  @IsEnum(propertyListing)
  @IsOptional()
  listing?: propertyListing;
}
