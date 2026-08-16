import { encode } from '@googlemaps/polyline-codec';
import { z } from 'zod';

import { fetchAsJson } from '#/utils/cache.server';

import type { RoutingMode } from '../types/routing-mode';

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
        waypoints: z
          .array(
            z.object({
              original_index: z.number().int().nonnegative(),
            }),
          )
          .optional(),
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

export interface OptimizedRoute {
  distanceMeters: number;
  durationSeconds: number;
  waypointOrder: number[];
}

interface RouteWithGeoapifyOptions {
  apiKey: string;
  mode?: RoutingMode;
  waypoints: Array<RoutingWaypoint>;
  signal?: AbortSignal;
}

const ROUTE_CACHE_SECONDS = 60 * 60 * 24 * 30;

async function requestGeoapifyRoute({
  apiKey,
  mode = 'drive',
  optimizeStops = false,
  signal,
  waypoints,
}: RouteWithGeoapifyOptions & { optimizeStops?: boolean }) {
  const requestUrl = new URL('https://api.geoapify.com/v1/routing');
  requestUrl.search = new URLSearchParams({
    apiKey,
    format: 'geojson',
    intermediate_waypoint_mode: 'stopover',
    mode,
    ...(optimizeStops ? { optimize_stops: 'true' } : {}),
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

  if (!route) {
    throw new Error('Geoapify returned an incomplete route');
  }

  return route;
}

export async function routeWithGeoapify({
  apiKey,
  mode,
  waypoints,
  signal,
}: RouteWithGeoapifyOptions): Promise<Array<RoutedTransition>> {
  if (waypoints.length < 2) {
    return [];
  }

  const route = await requestGeoapifyRoute({ apiKey, mode, signal, waypoints });
  const expectedTransitionCount = waypoints.length - 1;

  if (
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

export async function optimizeStopsWithGeoapify({
  apiKey,
  mode,
  waypoints,
  signal,
}: RouteWithGeoapifyOptions): Promise<OptimizedRoute> {
  if (waypoints.length < 2) {
    return {
      distanceMeters: 0,
      durationSeconds: 0,
      waypointOrder: waypoints.map((_, index) => index),
    };
  }

  const route = await requestGeoapifyRoute({
    apiKey,
    mode,
    optimizeStops: waypoints.length > 3,
    signal,
    waypoints,
  });
  const waypointOrder = route.properties.waypoints?.map(
    (waypoint) => waypoint.original_index,
  );
  const expectedWaypointOrder = waypoints.map((_, index) => index);
  const hasCompleteWaypointOrder =
    waypointOrder?.length === waypoints.length &&
    new Set(waypointOrder).size === waypoints.length &&
    waypointOrder.every((index) => expectedWaypointOrder.includes(index)) &&
    waypointOrder[0] === 0 &&
    waypointOrder.at(-1) === waypoints.length - 1;

  if (!hasCompleteWaypointOrder) {
    throw new Error('Geoapify returned an incomplete waypoint order');
  }

  return {
    distanceMeters: Math.round(
      route.properties.legs.reduce((total, leg) => total + leg.distance, 0),
    ),
    durationSeconds: Math.round(
      route.properties.legs.reduce((total, leg) => total + leg.time, 0),
    ),
    waypointOrder,
  };
}
