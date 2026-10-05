import { SelectQueryBuilder } from 'typeorm';

import { Property } from '@app/common-rentora/database/entity';
import { PropertySort } from '@app/common-rentora/enums';

import { SearchDto } from './dto/search.dto';

export function applyPropertyFilters(
  query: SelectQueryBuilder<Property>,
  dto: SearchDto,
) {
  // City
  if (dto.city) {
    query.andWhere('property.city = :city', {
      city: dto.city,
    });
  }

  // Category
  if (dto.category) {
    query.andWhere('property.category = :category', {
      category: dto.category,
    });
  }

  // Sale / rent
  if (dto.listing) {
    query.andWhere('property.listing = :listing', {
      listing: dto.listing,
    });
  }

  // Currency
  if (dto.currency) {
    query.andWhere('property.currency = :currency', {
      currency: dto.currency,
    });
  }

  // Price
  if (dto.minPrice !== undefined) {
    query.andWhere('property.price >= :minPrice', {
      minPrice: dto.minPrice,
    });
  }

  if (dto.maxPrice !== undefined) {
    query.andWhere('property.price <= :maxPrice', {
      maxPrice: dto.maxPrice,
    });
  }

  // Rooms
  if (dto.rooms !== undefined) {
    query.andWhere('property.rooms = :rooms', {
      rooms: dto.rooms,
    });
  }

  // Bedrooms
  if (dto.bedrooms !== undefined) {
    query.andWhere('property.bedrooms = :bedrooms', {
      bedrooms: dto.bedrooms,
    });
  }

  // Bathrooms
  if (dto.bathrooms !== undefined) {
    query.andWhere('property.bathrooms = :bathrooms', {
      bathrooms: dto.bathrooms,
    });
  }

  // Exact area — old public search support
  if (dto.area !== undefined) {
    query.andWhere('property.area = :area', {
      area: dto.area,
    });
  }

  // Area range
  if (dto.minArea !== undefined) {
    query.andWhere('property.area >= :minArea', {
      minArea: dto.minArea,
    });
  }

  if (dto.maxArea !== undefined) {
    query.andWhere('property.area <= :maxArea', {
      maxArea: dto.maxArea,
    });
  }

  // Exact floor — old public search support
  if (dto.floor !== undefined) {
    query.andWhere('property.floor = :floor', {
      floor: dto.floor,
    });
  }

  // Floor range
  if (dto.minFloor !== undefined) {
    query.andWhere('property.floor >= :minFloor', {
      minFloor: dto.minFloor,
    });
  }

  if (dto.maxFloor !== undefined) {
    query.andWhere('property.floor <= :maxFloor', {
      maxFloor: dto.maxFloor,
    });
  }

  // Exact construction year — old public search support
  if (dto.constructionYear !== undefined) {
    query.andWhere('property.constructionYear = :constructionYear', {
      constructionYear: dto.constructionYear,
    });
  }

  // Construction year range
  if (dto.minConstructionYear !== undefined) {
    query.andWhere('property.constructionYear >= :minConstructionYear', {
      minConstructionYear: dto.minConstructionYear,
    });
  }

  if (dto.maxConstructionYear !== undefined) {
    query.andWhere('property.constructionYear <= :maxConstructionYear', {
      maxConstructionYear: dto.maxConstructionYear,
    });
  }

  // Condition
  if (dto.condition) {
    query.andWhere('property.condition = :condition', {
      condition: dto.condition,
    });
  }

  // Building type
  if (dto.buildingType) {
    query.andWhere('property.buildingType = :buildingType', {
      buildingType: dto.buildingType,
    });
  }

  // Features
  if (dto.features?.length) {
    query.andWhere('property.features @> :features', {
      features: dto.features,
    });
  }

  // Sort
  switch (dto.sort) {
    case PropertySort.PRICE_ASC:
      query.orderBy('property.price', 'ASC');
      break;

    case PropertySort.PRICE_DESC:
      query.orderBy('property.price', 'DESC');
      break;

    case PropertySort.NEWEST:
      query.orderBy('property.createdAt', 'DESC');
      break;

    case PropertySort.OLDEST:
      query.orderBy('property.createdAt', 'ASC');
      break;

    case PropertySort.MOST_VIEWED:
      query.orderBy('property.view', 'DESC');
      break;
  }

  return query;
}
