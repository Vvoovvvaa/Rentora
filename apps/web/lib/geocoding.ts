export type GeocodingCoordinates = { latitude: number; longitude: number };
export type GeocodingPlace = { id: string; label: string };
export type ResolvedGeocodingPlace = GeocodingPlace & GeocodingCoordinates;

export interface GeocodingService {
  search(input: {
    query: string;
    city?: string;
    signal?: AbortSignal;
  }): Promise<GeocodingPlace[]>;
  resolve(
    input: GeocodingPlace & { city?: string; signal?: AbortSignal },
  ): Promise<ResolvedGeocodingPlace>;
  reverse(
    input: GeocodingCoordinates & { signal?: AbortSignal },
  ): Promise<string | null>;
}

const GEOAPIFY_GEOCODING_URL = 'https://api.geoapify.com/v1/geocode';
const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
const CITY_BIAS: Record<string, [number, number]> = {
  YEREVAN: [44.5152, 40.1872],
  GYUMRI: [43.8475, 40.7894],
  VANADZOR: [44.4939, 40.8128],
  VAGHARSHAPAT: [44.2946, 40.1656],
  HRAZDAN: [44.7662, 40.4975],
  ABOVYAN: [44.6266, 40.2737],
  KAPAN: [46.4058, 39.2075],
  GAVAR: [45.1269, 40.3581],
  ARMAVIR: [44.0382, 40.1545],
  ARTASHAT: [44.9534, 39.9539],
};

type GeoapifyResult = {
  place_id?: string;
  formatted?: string;
  lat?: number;
  lon?: number;
  country_code?: string;
  result_type?: string;
};
type GeoapifyResponse = { results?: GeoapifyResult[] };

export const isGeocodingConfigured = Boolean(GEOAPIFY_API_KEY);

export class GeocodingConfigurationError extends Error {
  constructor() {
    super(
      'Geoapify address search is not configured. Add NEXT_PUBLIC_GEOAPIFY_API_KEY and restart the app.',
    );
  }
}

function requireApiKey() {
  if (!GEOAPIFY_API_KEY) throw new GeocodingConfigurationError();
  return GEOAPIFY_API_KEY;
}

function cityName(city?: string) {
  return city
    ?.replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function searchText(query: string, city?: string) {
  const normalized = query.toLowerCase();
  const cityLabel = cityName(city);
  return [
    query,
    cityLabel && !normalized.includes(cityLabel.toLowerCase())
      ? cityLabel
      : undefined,
    !normalized.includes('armenia') ? 'Armenia' : undefined,
  ]
    .filter(Boolean)
    .join(', ');
}

function addLocationContext(params: URLSearchParams, city?: string) {
  // Geoapify applies the country filter strictly and uses the city point only to rank results.
  params.set('filter', 'countrycode:am');
  const bias = city ? CITY_BIAS[city] : undefined;
  if (bias) params.set('bias', `proximity:${bias[0]},${bias[1]}`);
}

function buildParams(input: { text?: string; city?: string; limit?: number }) {
  const params = new URLSearchParams({
    apiKey: requireApiKey(),
    format: 'json',
    lang: 'en',
    limit: String(input.limit ?? 5),
  });
  if (input.text) params.set('text', input.text);
  addLocationContext(params, input.city);
  return params;
}

function isArmenia(result: GeoapifyResult) {
  return result.country_code?.toLowerCase() === 'am';
}

function coordinatesOf(result?: GeoapifyResult): GeocodingCoordinates | null {
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);
  return hasValidCoordinates({ latitude, longitude })
    ? { latitude, longitude }
    : null;
}

function isPreciseAddress(result: GeoapifyResult) {
  return ['amenity', 'building', 'street'].includes(result.result_type || '');
}

async function geoapifyFetch<T>(
  path: string,
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(
    `${GEOAPIFY_GEOCODING_URL}/${path}?${params.toString()}`,
    { signal },
  );
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Geoapify API key was rejected. Check the Geoapify key and enabled geocoding products.',
      );
    }
    throw new Error('Geoapify geocoding request failed');
  }
  return response.json() as Promise<T>;
}

/** Keeps React form components independent from the current address-search provider. */
export const geocodingService: GeocodingService = {
  async search({ query, city, signal }) {
    const result = await geoapifyFetch<GeoapifyResponse>(
      'autocomplete',
      buildParams({ text: searchText(query, city), city }),
      signal,
    );
    return (result.results || [])
      .filter((place) => isArmenia(place) && Boolean(place.formatted))
      .map((place, index) => ({
        id: place.place_id || `${place.formatted}:${index}`,
        label: place.formatted!,
      }));
  },

  async resolve({ id, label, city, signal }) {
    // Autocomplete is intentionally followed by a forward-geocoding request so the submitted
    // point is a provider-validated address coordinate, never a fallback city centre.
    const result = await geoapifyFetch<GeoapifyResponse>(
      'search',
      buildParams({ text: searchText(label, city), city, limit: 5 }),
      signal,
    );
    const place = (result.results || []).find(
      (item) =>
        isArmenia(item) && isPreciseAddress(item) && coordinatesOf(item),
    );
    const coordinates = coordinatesOf(place);
    if (!place || !coordinates) {
      throw new Error(
        'Geoapify did not return a precise street or building coordinate for this address',
      );
    }
    return {
      id: place.place_id || id,
      label: place.formatted || label,
      ...coordinates,
    };
  },

  async reverse({ latitude, longitude, signal }) {
    const params = buildParams({ limit: 5 });
    params.set('lat', String(latitude));
    params.set('lon', String(longitude));
    // Reverse geocoding has no country filter parameter; validate the returned country instead.
    params.delete('filter');
    params.delete('bias');
    const result = await geoapifyFetch<GeoapifyResponse>(
      'reverse',
      params,
      signal,
    );
    const place = (result.results || []).find(
      (item) => isArmenia(item) && isPreciseAddress(item),
    );
    // Do not replace a selected street/building with a coarse city, region, or country label.
    return place?.formatted || null;
  },
};

type CoordinateInput = {
  latitude?: number | string | null;
  longitude?: number | string | null;
};

/**
 * Normalizes API coordinates once before any map receives them. Invalid or missing
 * values deliberately return null: markers must never be moved to a city fallback.
 */
export function getValidCoordinates(
  value?: CoordinateInput | null,
): GeocodingCoordinates | null {
  const latitude = Number(value?.latitude);
  const longitude = Number(value?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90) return null;
  if (longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export function hasValidCoordinates(value?: CoordinateInput | null) {
  return getValidCoordinates(value) !== null;
}
