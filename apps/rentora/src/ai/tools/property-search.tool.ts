import {
  ArmeniaCity,
  PropertyCategory,
  PropertyFeature,
  PropertyCondition,
  BuildingType,
  propertyListing,
  PropertySort,
} from '@app/common-rentora/enums';

import { PropertyCurrency } from '@app/common-rentora/enums/property-currency';

export const SEARCH_PROPERTIES_TOOL = {
  type: 'function' as const,

  name: 'search_properties',

  description:
    'Search real estate listings in the Rentora database. ' +
    'Use this tool whenever the user asks to find, search, recommend, ' +
    'filter or show real properties available on Rentora.',

  strict: true,

  parameters: {
    type: 'object',

    properties: {
      city: {
        type: ['string', 'null'],

        enum: [...Object.values(ArmeniaCity), null],

        description:
          'City where the property is located. ' +
          'Convert Armenian, Russian or English city names ' +
          'to the exact ArmeniaCity enum value.',
      },

      category: {
        type: ['string', 'null'],

        enum: [...Object.values(PropertyCategory), null],

        description:
          'Type/category of property requested by the user, ' +
          'using an exact PropertyCategory enum value.',
      },

      sort: {
        type: ['string', 'null'],

        enum: [...Object.values(PropertySort), null],

        description:
          'Optional sorting mode for search results. ' +
          'Use PRICE_ASC when the user asks for cheapest or lower-priced properties first. ' +
          'Use PRICE_DESC when the user asks for most expensive properties first. ' +
          'Use NEWEST when the user asks for newest or recently added listings. ' +
          'Use OLDEST when the user asks for oldest listings. ' +
          'Use MOST_VIEWED when the user asks for popular or most viewed listings.',
      },

      listing: {
        type: ['string', 'null'],

        enum: [...Object.values(propertyListing), null],

        description:
          'Listing transaction type. ' +
          'Use the exact propertyListing enum value. ' +
          'For example, use the corresponding SALE value when the user wants to buy ' +
          'and RENT when the user wants to rent.',
      },

      minPrice: {
        type: ['number', 'null'],

        description:
          'Minimum acceptable property price. ' +
          'Use null when the user did not specify a minimum price.',
      },

      maxPrice: {
        type: ['number', 'null'],

        description:
          'Maximum acceptable property price. ' +
          'For phrases such as "up to 100000", set maxPrice to 100000.',
      },

      currency: {
        type: ['string', 'null'],

        enum: [...Object.values(PropertyCurrency), null],

        description:
          'Currency used for the requested price range. ' +
          'Use an exact PropertyCurrency enum value.',
      },

      rooms: {
        type: ['number', 'null'],

        description: 'Exact number of rooms requested by the user.',
      },

      bedrooms: {
        type: ['number', 'null'],

        description: 'Exact number of bedrooms requested by the user.',
      },

      bathrooms: {
        type: ['number', 'null'],

        description: 'Exact number of bathrooms requested by the user.',
      },

      minArea: {
        type: ['number', 'null'],

        description: 'Minimum property area in square meters.',
      },

      maxArea: {
        type: ['number', 'null'],

        description: 'Maximum property area in square meters.',
      },

      minFloor: {
        type: ['number', 'null'],

        description: 'Minimum acceptable floor of the property.',
      },

      maxFloor: {
        type: ['number', 'null'],

        description: 'Maximum acceptable floor of the property.',
      },

      minConstructionYear: {
        type: ['number', 'null'],

        description:
          'Minimum acceptable construction year. ' +
          'For example, if the user asks for a building constructed after 2015, use 2015.',
      },

      maxConstructionYear: {
        type: ['number', 'null'],

        description: 'Maximum acceptable construction year.',
      },

      condition: {
        type: ['string', 'null'],

        enum: [...Object.values(PropertyCondition), null],

        description:
          'Required condition of the property. ' +
          'Use only an exact PropertyCondition enum value.',
      },

      buildingType: {
        type: ['string', 'null'],

        enum: [...Object.values(BuildingType), null],

        description:
          'Required building type. ' +
          'Use only an exact BuildingType enum value.',
      },

      features: {
        type: ['array', 'null'],

        items: {
          type: 'string',

          enum: [...Object.values(PropertyFeature)],
        },

        description:
          'Required property features. ' +
          'Every item must be an exact PropertyFeature enum value. ' +
          'Include only features explicitly requested or clearly implied by the user.',
      },
    },

    required: [
      'city',
      'category',
      'listing',
      'minPrice',
      'maxPrice',
      'currency',
      'rooms',
      'bedrooms',
      'bathrooms',
      'minArea',
      'maxArea',
      'minFloor',
      'maxFloor',
      'minConstructionYear',
      'maxConstructionYear',
      'condition',
      'buildingType',
      'features',
      'sort',
    ],

    additionalProperties: false,
  },
};
