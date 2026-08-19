import { PropertySort } from 'apps/web/types/models';
import {
    ArmeniaCity,
    PropertyCategory,
    PropertyFeature,
    PropertyCondition,
    BuildingType,
    propertyListing,
} from '../enums';

import { PropertyCurrency } from '../enums/property-currency';

export interface SearchPropertiesArgs {
    city: ArmeniaCity | null;

    category: PropertyCategory | null;

    listing: propertyListing | null;

    minPrice: number | null;

    maxPrice: number | null;

    currency: PropertyCurrency | null;

    rooms: number | null;

    bedrooms: number | null;

    bathrooms: number | null;

    minArea: number | null;

    maxArea: number | null;

    minFloor: number | null;

    maxFloor: number | null;

    minConstructionYear: number | null;

    maxConstructionYear: number | null;

    condition: PropertyCondition | null;

    buildingType: BuildingType | null;

    features: PropertyFeature[] | null;

    sort: PropertySort | null
}