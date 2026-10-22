export type GeocodingCoordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodingPlace = {
  id: string;
  label: string;
  /** Best city match discovered from the autocomplete result, if available. */
  cityCode?: string | null;
};

export type ResolvedGeocodingPlace = GeocodingPlace &
  GeocodingCoordinates & {
    cityCode: string;
    cityName: string;
  };

export type ReverseGeocodingPlace = {
  label: string;
  cityCode: string;
  cityName: string;
};

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
  ): Promise<ReverseGeocodingPlace | null>;
}

const GEOAPIFY_GEOCODING_URL = 'https://api.geoapify.com/v1/geocode';
const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

/** Values must match the city codes accepted by the property form/backend. */
const CITY_ALIASES: Record<string, string[]> = {
  YEREVAN: ['yerevan', 'erevan'],
  GYUMRI: ['gyumri', 'leninakan'],
  ARTIK: ['artik'],
  MARALIK: ['maralik'],
  VANADZOR: ['vanadzor', 'kirovakan'],
  SPITAK: ['spitak'],
  ALAVERDI: ['alaverdi'],
  STEPANAVAN: ['stepanavan'],
  TASHIR: ['tashir', 'kalinino'],
  HRAZDAN: ['hrazdan'],
  ABOVYAN: ['abovyan'],
  CHARRENTSAVAN: ['charentsavan', 'charentsavan'],
  TSAGHKADZOR: ['tsaghkadzor', 'tsakhkadzor'],
  BYUREGHAVAN: ['byureghavan'],
  ARTASHAT: ['artashat'],
  MASIS: ['masis'],
  VEDI: ['vedi'],
  ARMAVIR: ['armavir'],
  VAGHARSHAPAT: ['vagharshapat', 'ejmiatsin', 'etchmiadzin', 'echmiadzin'],
  METSAMOR: ['metsamor'],
  GAVAR: ['gavar'],
  SEVAN: ['sevan'],
  MARTUNI: ['martuni'],
  VARDENIS: ['vardenis'],
  CHAMBRAK: ['chambrak', 'chambarak'],
  IJEVAN: ['ijevan'],
  DILIJAN: ['dilijan'],
  NOYEMBERYAN: ['noyemberyan', 'noyemberian'],
  BERD: ['berd'],
  KAPAN: ['kapan'],
  GORIS: ['goris'],
  SISIAN: ['sisian'],
  MEGHRI: ['meghri'],
  AGARAK: ['agarak'],
  YEGHEGNADZOR: ['yeghegnadzor'],
  JERMUK: ['jermuk'],
  VAYK: ['vayk'],
  ASHTARAK: ['ashtarak'],
  APARAN: ['aparan'],
  TALIN: ['talin'],
};

const CITY_LABELS: Record<string, string> = {
  YEREVAN: 'Yerevan',
  GYUMRI: 'Gyumri',
  ARTIK: 'Artik',
  MARALIK: 'Maralik',
  VANADZOR: 'Vanadzor',
  SPITAK: 'Spitak',
  ALAVERDI: 'Alaverdi',
  STEPANAVAN: 'Stepanavan',
  TASHIR: 'Tashir',
  HRAZDAN: 'Hrazdan',
  ABOVYAN: 'Abovyan',
  CHARRENTSAVAN: 'Charentsavan',
  TSAGHKADZOR: 'Tsaghkadzor',
  BYUREGHAVAN: 'Byureghavan',
  ARTASHAT: 'Artashat',
  MASIS: 'Masis',
  VEDI: 'Vedi',
  ARMAVIR: 'Armavir',
  VAGHARSHAPAT: 'Vagharshapat',
  METSAMOR: 'Metsamor',
  GAVAR: 'Gavar',
  SEVAN: 'Sevan',
  MARTUNI: 'Martuni',
  VARDENIS: 'Vardenis',
  CHAMBRAK: 'Chambarak',
  IJEVAN: 'Ijevan',
  DILIJAN: 'Dilijan',
  NOYEMBERYAN: 'Noyemberyan',
  BERD: 'Berd',
  KAPAN: 'Kapan',
  GORIS: 'Goris',
  SISIAN: 'Sisian',
  MEGHRI: 'Meghri',
  AGARAK: 'Agarak',
  YEGHEGNADZOR: 'Yeghegnadzor',
  JERMUK: 'Jermuk',
  VAYK: 'Vayk',
  ASHTARAK: 'Ashtarak',
  APARAN: 'Aparan',
  TALIN: 'Talin',
};

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
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  district?: string;
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

function normalizeName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function cityCodeFromName(name?: string | null): string | null {
  if (!name) return null;
  const normalized = normalizeName(name);

  for (const [code, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some((alias) => normalizeName(alias) === normalized)) {
      return code;
    }
  }

  return null;
}

function cityCodeFromResult(result: GeoapifyResult): string | null {
  // Prefer structured address fields. This avoids mistaking a business name such as
  // "Yerevan Mobile" for the actual city when the address is in Vanadzor.
  const structuredNames = [
    result.city,
    result.town,
    result.municipality,
    result.village,
    result.suburb,
    result.district,
  ];

  for (const name of structuredNames) {
    const code = cityCodeFromName(name);
    if (code) return code;
  }

  // Geoapify's formatted address often contains the city even if a structured
  // field is absent. Only match complete comma-separated parts, not substrings.
  for (const part of (result.formatted || '').split(',')) {
    const code = cityCodeFromName(part.trim());
    if (code) return code;
  }

  return null;
}

function cityNameFromResult(result: GeoapifyResult, cityCode: string) {
  const fields = [
    result.city,
    result.town,
    result.municipality,
    result.village,
    result.suburb,
    result.district,
  ];

  const explicitName = fields.find(
    (name) => name && cityCodeFromName(name) === cityCode,
  );
  if (explicitName) return explicitName;

  const formattedPart = (result.formatted || '')
    .split(',')
    .map((part) => part.trim())
    .find((part) => cityCodeFromName(part) === cityCode);

  return formattedPart || CITY_LABELS[cityCode] || cityCode;
}

function searchText(query: string) {
  // Do NOT append the currently selected form city. The user may intentionally
  // search for an address in another city; the city is only a ranking bias below.
  const trimmed = query.trim();
  if (/\barmenia\b/i.test(trimmed)) return trimmed;
  return `${trimmed}, Armenia`;
}

function addLocationContext(params: URLSearchParams, city?: string) {
  // Restrict results to Armenia. The selected form city only biases ranking;
  // it must never exclude a genuine address from another Armenian city.
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

/** Keeps form components independent from the current address-search provider. */
export const geocodingService: GeocodingService = {
  async search({ query, city, signal }) {
    const result = await geoapifyFetch<GeoapifyResponse>(
      'autocomplete',
      buildParams({ text: searchText(query), city }),
      signal,
    );

    return (result.results || [])
      .filter((place) => isArmenia(place) && Boolean(place.formatted))
      .map((place, index) => ({
        id: place.place_id || `${place.formatted}:${index}`,
        label: place.formatted!,
        cityCode: cityCodeFromResult(place),
      }));
  },

  async resolve({ id, label, city, cityCode, signal }) {
    // The address text itself controls geocoding. The selected form city is only
    // a proximity bias, so it cannot rewrite or contradict the requested address.
    const result = await geoapifyFetch<GeoapifyResponse>(
      'search',
      buildParams({ text: searchText(label), city, limit: 5 }),
      signal,
    );

    const preciseResults = (result.results || []).filter(
      (item) => isArmenia(item) && isPreciseAddress(item) && coordinatesOf(item),
    );

    if (!preciseResults.length) {
      throw new Error(
        'Geoapify did not return a precise street or building coordinate for this address. Try another suggestion.',
      );
    }

    // Prefer a result matching the city detected during autocomplete; otherwise
    // use the first precise result that belongs to a supported city.
    const place =
      (cityCode
        ? preciseResults.find((item) => cityCodeFromResult(item) === cityCode)
        : undefined) ||
      preciseResults.find((item) => cityCodeFromResult(item) !== null);

    if (!place) {
      throw new Error(
        'Could not identify this address as one of Rentora’s supported cities. Choose another address suggestion.',
      );
    }

    const coordinates = coordinatesOf(place);
    const resolvedCityCode = cityCodeFromResult(place);

    if (!coordinates || !resolvedCityCode) {
      throw new Error('Could not verify the city and coordinates for this address.');
    }

    return {
      id: place.place_id || id,
      label: place.formatted || label,
      ...coordinates,
      cityCode: resolvedCityCode,
      cityName: CITY_LABELS[resolvedCityCode] || resolvedCityCode,
    };
  },

  async reverse({ latitude, longitude, signal }) {
    const params = buildParams({ limit: 5 });
    params.set('lat', String(latitude));
    params.set('lon', String(longitude));
    // Reverse geocoding has no country filter parameter; validate the returned country.
    params.delete('filter');
    params.delete('bias');

    const result = await geoapifyFetch<GeoapifyResponse>(
      'reverse',
      params,
      signal,
    );

    const place = (result.results || []).find(
      (item) =>
        isArmenia(item) &&
        isPreciseAddress(item) &&
        cityCodeFromResult(item) !== null,
    );

    if (!place?.formatted) return null;

    const cityCode = cityCodeFromResult(place);
    if (!cityCode) return null;

    return {
      label: place.formatted,
      cityCode,
      cityName: CITY_LABELS[cityCode] || cityCode,
    };
  },
};

type CoordinateInput = {
  latitude?: number | string | null;
  longitude?: number | string | null;
};

/** Normalizes API coordinates before any map receives them. */
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
