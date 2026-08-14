import { encode } from '@googlemaps/polyline-codec';
import { z } from 'zod';

import { fetchAsJson } from '#/utils/cache.server';

const coordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

const routeResponseSchema = z.object({
  features: z.array(
    z.object({
      geometry: z.object({
        type: z.literal('MultiLineString'),
        coordinates: z.array(z.array(coordinateSchema).min(2)),
      }),
      properties: z.object({
        legs: z.array(
          z.object({
            distance: z.number().nonnegative(),
            time: z.number().nonnegative(),
          }),
        ),
      }),
    }),
  ),
});

export interface RoutingWaypoint {
  latitude: number;
  longitude: number;
}

export interface RoutedTransition {
  distanceMeters: number;
  durationSeconds: number;
  encodedPolyline: string;
}

interface RouteWithGeoapifyOptions {
  apiKey: string;
  waypoints: Array<RoutingWaypoint>;
  signal?: AbortSignal;
}

const ROUTE_CACHE_SECONDS = 60 * 60 * 24 * 30;

export async function routeWithGeoapify({
  apiKey,
  waypoints,
  signal,
}: RouteWithGeoapifyOptions): Promise<Array<RoutedTransition>> {
  if (waypoints.length < 2) {
    return [];
  }

  const requestUrl = new URL('https://api.geoapify.com/v1/routing');
  requestUrl.search = new URLSearchParams({
    apiKey,
    format: 'geojson',
    intermediate_waypoint_mode: 'stopover',
    mode: 'drive',
    traffic: 'free_flow',
    waypoints: waypoints
      .map(({ latitude, longitude }) => `${latitude},${longitude}`)
      .join('|'),
  }).toString();

  const cacheUrl = new URL(requestUrl);
  cacheUrl.searchParams.delete('apiKey');

  const response = await fetchAsJson<unknown>(requestUrl, {
    cacheKey: cacheUrl.toString(),
    cacheTtlSeconds: ROUTE_CACHE_SECONDS,
    signal,
  });
  const parsedResponse = routeResponseSchema.safeParse(response);
  const route = parsedResponse.success
    ? parsedResponse.data.features.at(0)
    : null;
  const expectedTransitionCount = waypoints.length - 1;

  if (
    !route ||
    route.properties.legs.length !== expectedTransitionCount ||
    route.geometry.coordinates.length !== expectedTransitionCount
  ) {
    throw new Error('Geoapify returned an incomplete route');
  }

  return route.properties.legs.map((leg, index) => ({
    distanceMeters: Math.round(leg.distance),
    durationSeconds: Math.round(leg.time),
    encodedPolyline: encode(
      route.geometry.coordinates[index].map(([longitude, latitude]) => [
        latitude,
        longitude,
      ]),
    ),
  }));
}
