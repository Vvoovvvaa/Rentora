import { SelectQueryBuilder } from 'typeorm';

import { Property } from '@app/common-rentora/database/entity';
import { PropertySort } from '@app/common-rentora/enums';
import { SearchDto } from './dto/search.dto';

/** Applies the public search contract to an existing Property query. */
export function applyPropertyFilters(
  query: SelectQueryBuilder<Property>,
  dto: SearchDto,
) {
  if (dto.city) query.andWhere('property.city = :city', { city: dto.city });
  if (dto.category)
    query.andWhere('property.category = :category', { category: dto.category });
  if (dto.listing)
    query.andWhere('property.listing = :listing', { listing: dto.listing });
  if (dto.currency)
    query.andWhere('property.currency = :currency', { currency: dto.currency });
  if (dto.minPrice !== undefined)
    query.andWhere('property.price >= :minPrice', { minPrice: dto.minPrice });
  if (dto.maxPrice !== undefined)
    query.andWhere('property.price <= :maxPrice', { maxPrice: dto.maxPrice });
  if (dto.rooms !== undefined)
    query.andWhere('property.rooms = :rooms', { rooms: dto.rooms });
  if (dto.area !== undefined)
    query.andWhere('property.area = :area', { area: dto.area });
  if (dto.bedrooms !== undefined)
    query.andWhere('property.bedrooms = :bedrooms', { bedrooms: dto.bedrooms });
  if (dto.floor !== undefined)
    query.andWhere('property.floor = :floor', { floor: dto.floor });
  if (dto.constructionYear !== undefined)
    query.andWhere('property.constructionYear = :constructionYear', {
      constructionYear: dto.constructionYear,
    });
  if (dto.features)
    query.andWhere('property.features @> :features', {
      features: [dto.features],
    });

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
      query.orderBy('property.views', 'DESC');
      break;
  }

  return query;
}
