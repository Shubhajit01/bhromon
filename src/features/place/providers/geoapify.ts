import { z } from 'zod';

import { fetchAsJson } from '#/utils/cache.server';

const geoapifyPlaceSchema = z.object({
  name: z.string().optional(),
  address_line1: z.string().optional(),
  formatted: z.string(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  place_id: z.string().min(1),
  result_type: z.string().optional(),
  rank: z
    .object({
      confidence: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

const geoapifySearchResponseSchema = z.object({
  results: z.array(geoapifyPlaceSchema).optional(),
});

export interface PlaceSearchCandidate {
  address: string;
  latitude: number;
  longitude: number;
  name: string;
  provider: 'geoapify';
  providerPlaceId: string;
  resultType?: string;
  confidence?: number;
}

interface SearchGeoapifyPlacesOptions {
  apiKey: string;
  destination: string;
  query: string;
  signal?: AbortSignal;
}

const PLACE_SEARCH_CACHE_SECONDS = 60 * 60 * 24 * 30;

export async function searchGeoapifyPlaces({
  apiKey,
  destination,
  query,
  signal,
}: SearchGeoapifyPlacesOptions): Promise<Array<PlaceSearchCandidate>> {
  const requestUrl = new URL('https://api.geoapify.com/v1/geocode/search');
  requestUrl.search = new URLSearchParams({
    apiKey,
    bias: 'countrycode:none',
    format: 'json',
    lang: 'en',
    limit: '3',
    text: `${query}, ${destination}`,
  }).toString();

  const cacheUrl = new URL(requestUrl);
  cacheUrl.searchParams.delete('apiKey');

  const response = await fetchAsJson<unknown>(requestUrl, {
    cacheKey: cacheUrl.toString(),
    cacheTtlSeconds: PLACE_SEARCH_CACHE_SECONDS,
    signal,
  });
  const parsedResponse = geoapifySearchResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    return [];
  }

  return (parsedResponse.data.results ?? []).map((result) => ({
    provider: 'geoapify',
    providerPlaceId: result.place_id,
    name: result.name ?? result.address_line1 ?? query,
    address: result.formatted,
    latitude: result.lat,
    longitude: result.lon,
    ...(result.result_type ? { resultType: result.result_type } : {}),
    ...(result.rank?.confidence !== undefined
      ? { confidence: result.rank.confidence }
      : {}),
  }));
}
