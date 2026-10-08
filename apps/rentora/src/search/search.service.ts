import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Property } from '@app/common-rentora/database/entity';
import { SearchDto } from './dto/search.dto';
import { PropertyPublishing, PropertyStatus } from '@app/common-rentora/enums';
import { applyPropertyFilters } from './property-filter.helper';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
  ) {}

  async searchProperties(dto: SearchDto) {
    const query = this.propertyRepo
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.images', 'images')
      .leftJoinAndSelect('property.owner', 'owner')
      .leftJoinAndSelect('property.agency', 'agency')
      .leftJoinAndSelect('agency.image', 'agencyImage')
      .where('property.status = :status', { status: PropertyStatus.ACTIVE })
      .andWhere('property.publishing = :publishing', {
        publishing: PropertyPublishing.ACTIVE,
      });

    return applyPropertyFilters(query, dto).getMany();
  }
}

// features
