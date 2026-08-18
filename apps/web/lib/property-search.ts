import type {
  ArmeniaCity,
  Currency,
  PropertyFeature,
  PropertyListing,
  PropertySort,
  SearchParams,
} from '@/types/models';

export type SearchFormState = {
  city: string;
  category: string;
  listing: PropertyListing | '';
  currency: Currency | '';
  rooms: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  floor: string;
  constructionYear: string;
  area: string;
  features: PropertyFeature | '';
  sort: PropertySort | '';
};
export const searchParamKeys = [
  'city',
  'category',
  'listing',
  'currency',
  'rooms',
  'minPrice',
  'maxPrice',
  'bedrooms',
  'floor',
  'constructionYear',
  'area',
  'features',
  'sort',
] as const;
export const blankSearchState: SearchFormState = {
  city: '',
  category: '',
  listing: '',
  currency: '',
  rooms: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
  floor: '',
  constructionYear: '',
  area: '',
  features: '',
  sort: '',
};
export function searchStateFromParams(
  params: URLSearchParams,
): SearchFormState {
  return searchParamKeys.reduce(
    (state, key) => ({ ...state, [key]: params.get(key) || '' }),
    blankSearchState,
  );
}
export function searchRequestFromState(state: SearchFormState): SearchParams {
  const request: SearchParams = {};
  if (state.city) request.city = state.city as ArmeniaCity;
  if (state.category)
    request.category = state.category as SearchParams['category'];
  if (state.listing) request.listing = state.listing;
  if (state.currency) request.currency = state.currency;
  (
    [
      'rooms',
      'minPrice',
      'maxPrice',
      'bedrooms',
      'floor',
      'constructionYear',
      'area',
    ] as const
  ).forEach((key) => {
    if (state[key]) request[key] = Number(state[key]);
  });
  if (state.features) request.features = state.features;
  if (state.sort) request.sort = state.sort;
  return request;
}
export function applySearchState(
  params: URLSearchParams,
  state: SearchFormState,
) {
  searchParamKeys.forEach((key) => {
    params.delete(key);
    if (state[key]) params.set(key, state[key]);
  });
  return params;
}
export function queryWithSearchParams(params: URLSearchParams) {
  const next = new URLSearchParams();
  searchParamKeys.forEach((key) => {
    const value = params.get(key);
    if (value) next.set(key, value);
  });
  return next;
}
