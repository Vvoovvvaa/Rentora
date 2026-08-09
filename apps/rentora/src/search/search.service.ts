import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Property } from '@app/common-rentora/database/entity';
import { SearchDto } from './dto/search.dto';
import { PropertySort, PropertyStatus } from '@app/common-rentora/database/enums';

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(Property)
        private readonly propertyRepo: Repository<Property>
    ) { }

    async searchProperties(dto: SearchDto) {
        const { city, minPrice, maxPrice, category, area, rooms, sort, bedrooms, floor, constructionYear, features, currency, listing } = dto

        const query = this.propertyRepo
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.images', 'images')
            .leftJoinAndSelect('property.owner', 'owner')
            .where('property.status = :status', { status: PropertyStatus.ACTIVE })


        if (city) {
            query.andWhere(
                'property.city = :city', { city }
            )
        }

        if (minPrice) {
            query.andWhere(
                'property.price >= :minPrice', { minPrice }
            )
        }

        if (maxPrice) {
            query.andWhere(
                'property.price <= :maxPrice', { maxPrice }
            )
        }

        if (category) {
            query.andWhere(
                'property.category = :category', { category }
            )
        }

        if (rooms) {
            query.andWhere(
                'property.rooms = :rooms', { rooms }
            )
        }

        if (area) {
            query.andWhere(
                'property.area = :area', { area }
            )
        }

        if (sort) {

            switch (sort) {

                case PropertySort.PRICE_ASC:
                    query.orderBy(
                        'property.price',
                        'ASC'
                    );
                    break;


                case PropertySort.PRICE_DESC:
                    query.orderBy(
                        'property.price',
                        'DESC'
                    );
                    break;


                case PropertySort.NEWEST:
                    query.orderBy(
                        'property.createdAt',
                        'DESC'
                    );
                    break;


                case PropertySort.OLDEST:
                    query.orderBy(
                        'property.createdAt',
                        'ASC'
                    );
                    break;


                case PropertySort.MOST_VIEWED:
                    query.orderBy(
                        'property.views',
                        'DESC'
                    );
                    break;
            }

        }

        if (bedrooms) {
            query.andWhere(
                'property.bedrooms = :bedrooms', { bedrooms }
            )
        }

        if (floor) {
            query.andWhere(
                'property.floor = :floor', { floor }
            )
        }

        if (constructionYear) {
            query.andWhere(
                "property.constructionYear = :constructionYear", { constructionYear }
            )
        }

        if (features?.length) {
            query.andWhere(
                'property.features @> :features',
                { features }
            )
        }

        if(currency){
            query.andWhere(
                'property.currecny = :currency', {currency}
            )
        }

        if (listing) {
            query.andWhere(
                'property.listing = :listing', { listing }
            )
        }

        return query.getMany()
    }


}


// features
