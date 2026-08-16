import { z } from 'zod';

import { fetchAsJson } from '#/utils/cache.server';

const detailsResponseSchema = z.object({
  features: z
    .array(
      z.object({
        properties: z.object({
          opening_hours: z.string().optional(),
        }),
      }),
    )
    .min(1),
});

const DETAILS_CACHE_SECONDS = 60 * 60 * 24;

export interface PlaceOpeningHoursResult {
  available: boolean;
  openingHours?: string;
}

export async function getGeoapifyPlaceOpeningHours({
  apiKey,
  placeId,
  signal,
}: {
  apiKey: string;
  placeId: string;
  signal?: AbortSignal;
}): Promise<PlaceOpeningHoursResult> {
  const requestUrl = new URL('https://api.geoapify.com/v2/place-details');
  requestUrl.search = new URLSearchParams({
    apiKey,
    id: placeId,
    features: 'details',
  }).toString();
  const cacheUrl = new URL(requestUrl);
  cacheUrl.searchParams.delete('apiKey');
  const response = await fetchAsJson<unknown>(requestUrl, {
    cacheKey: cacheUrl.toString(),
    cacheTtlSeconds: DETAILS_CACHE_SECONDS,
    signal,
  });
  const parsed = detailsResponseSchema.safeParse(response);
  const hours = parsed.success
    ? parsed.data.features.at(0)!.properties.opening_hours
    : undefined;
  return {
    available: typeof hours === 'string' && hours.trim().length > 0,
    ...(hours !== undefined ? { openingHours: hours } : {}),
  };
}
