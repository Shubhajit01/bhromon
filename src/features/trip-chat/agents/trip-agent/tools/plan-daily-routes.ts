import { tool } from 'ai';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { db, inArray, place } from '#/db/db.server';
import { optimizeStopsWithGeoapify } from '#/features/trip/providers/geoapify-routing.server';
import { routingModes } from '#/features/trip/types/routing-mode';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';

const routeVisitSchema = z.object({
  placeId: z.number().int().positive(),
  locked: z
    .boolean()
    .optional()
    .describe(
      'Keep this stop in its proposed position because of a fixed booking, time, or traveller requirement',
    ),
});

const routeDaySchema = z.object({
  dayId: z.string().trim().min(1),
  mode: z.enum(routingModes),
  visits: z.array(routeVisitSchema).min(2).max(12),
});

export const planDailyRoutesInputSchema = z.object({
  days: z
    .array(routeDaySchema)
    .min(1)
    .max(14)
    .describe('Days whose proposed stop order should be checked'),
});

interface CreatePlanDailyRoutesToolOptions {
  tripId: string;
}

interface RoutePlace {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
}

const logger = createLogger('plan-daily-routes-tool');

function getSegmentBoundaries(visits: z.infer<typeof routeVisitSchema>[]) {
  return [
    ...new Set([
      0,
      ...visits.flatMap((visit, index) => (visit.locked ? [index] : [])),
      visits.length - 1,
    ]),
  ].sort((left, right) => left - right);
}

async function planDay(
  day: z.infer<typeof routeDaySchema>,
  apiKey: string,
  placesById: Map<number, RoutePlace>,
  signal?: AbortSignal,
) {
  const unresolvedPlaceIds = day.visits
    .map((visit) => visit.placeId)
    .filter((placeId) => !placesById.has(placeId));

  if (unresolvedPlaceIds.length > 0) {
    return {
      dayId: day.dayId,
      planned: false as const,
      reason: 'Some places could not be resolved',
      unresolvedPlaceIds,
    };
  }

  const boundaries = getSegmentBoundaries(day.visits);
  const plannedSegments = await Promise.all(
    boundaries.slice(0, -1).map(async (startIndex, boundaryIndex) => {
      const endIndex = boundaries[boundaryIndex + 1];
      const segmentVisits = day.visits.slice(startIndex, endIndex + 1);
      const route = await optimizeStopsWithGeoapify({
        apiKey,
        mode: day.mode,
        signal,
        waypoints: segmentVisits.map((visit) => {
          const routePlace = placesById.get(visit.placeId)!;

          return {
            latitude: routePlace.latitude,
            longitude: routePlace.longitude,
          };
        }),
      });

      return {
        ...route,
        placeIds: route.waypointOrder.map(
          (waypointIndex) => segmentVisits[waypointIndex].placeId,
        ),
      };
    }),
  );
  const orderedPlaceIds = plannedSegments.flatMap((segment, index) =>
    index === 0 ? segment.placeIds : segment.placeIds.slice(1),
  );

  return {
    dayId: day.dayId,
    planned: true as const,
    mode: day.mode,
    orderedStops: orderedPlaceIds.map((placeId) => ({
      placeId,
      name: placesById.get(placeId)!.name,
    })),
    distanceMeters: plannedSegments.reduce(
      (total, segment) => total + segment.distanceMeters,
      0,
    ),
    durationSeconds: plannedSegments.reduce(
      (total, segment) => total + segment.durationSeconds,
      0,
    ),
    changed: orderedPlaceIds.some(
      (placeId, index) => placeId !== day.visits[index].placeId,
    ),
  };
}

export function createPlanDailyRoutesTool({
  tripId,
}: CreatePlanDailyRoutesToolOptions) {
  return tool({
    description:
      'Recommend an efficient order for each day using real routes. The first and last stops stay fixed. Mark any intermediate stop as locked when its proposed position is constrained by a booking, time, or traveller requirement.',
    inputSchema: planDailyRoutesInputSchema,
    execute: async ({ days }, { abortSignal }) => {
      const startedAt = performance.now();
      const apiKey = z
        .string()
        .trim()
        .min(1)
        .safeParse(Reflect.get(env, 'GEOAPIFY_API_KEY'));

      if (!apiKey.success) {
        return {
          available: false as const,
          reason: 'Routing provider is not configured',
        };
      }

      const requestedPlaceIds = [
        ...new Set(
          days.flatMap((day) => day.visits.map(({ placeId }) => placeId)),
        ),
      ];

      logger.info('plan_daily_routes.started', {
        dayCount: days.length,
        tripId,
        visitCount: days.reduce((count, day) => count + day.visits.length, 0),
      });

      try {
        const routePlaces = await db
          .select({
            id: place.id,
            latitude: place.latitude,
            longitude: place.longitude,
            name: place.name,
          })
          .from(place)
          .where(inArray(place.id, requestedPlaceIds));
        const placesById = new Map(
          routePlaces.map((routePlace) => [routePlace.id, routePlace]),
        );
        const plannedDays = await Promise.all(
          days.map((day) => planDay(day, apiKey.data, placesById, abortSignal)),
        );

        logger.info('plan_daily_routes.completed', {
          changedDayCount: plannedDays.filter(
            (day) => day.planned && day.changed,
          ).length,
          dayCount: days.length,
          durationMs: elapsedMilliseconds(startedAt),
          tripId,
        });

        return {
          available: true as const,
          days: plannedDays,
          attribution: {
            provider: 'Geoapify',
            dataSource: 'OpenStreetMap contributors',
          },
        };
      } catch (error) {
        logger.error('plan_daily_routes.failed', error, {
          dayCount: days.length,
          durationMs: elapsedMilliseconds(startedAt),
          tripId,
        });
        return {
          available: false as const,
          reason: 'Routes could not be planned right now',
        };
      }
    },
  });
}
