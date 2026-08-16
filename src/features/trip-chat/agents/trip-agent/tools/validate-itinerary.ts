import { tool } from 'ai';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { and, db, eq, inArray, place, placeExternalId } from '#/db/db.server';
import { getGeoapifyPlaceOpeningHours } from '#/features/trip/providers/geoapify-place-details.server';
import { routeWithGeoapify } from '#/features/trip/providers/geoapify-routing.server';
import { routingModes } from '#/features/trip/types/routing-mode';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';

import {
  evaluateOpeningHours,
  minutes,
  validateTimeline,
} from './validate-itinerary-pure';

const logger = createLogger('validate-itinerary-tool');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const window = z
  .object({ startTime: time, endTime: time })
  .superRefine((value, context) => {
    if (minutes(value.endTime) <= minutes(value.startTime))
      context.addIssue({
        code: 'custom',
        message: 'Window end must be after start',
        path: ['endTime'],
      });
  });
const visitSchema = z.object({
  placeId: z
    .number()
    .int()
    .positive()
    .describe('Canonical place ID returned by searchPlaces'),
  startTime: time,
  endTime: time,
  minimumVisitMinutes: z
    .number()
    .int()
    .positive()
    .max(1440)
    .optional()
    .describe(
      'Minimum time from a known provider fact or traveller-agreed constraint',
    ),
  fixedBooking: window
    .optional()
    .describe('Exact immutable booking time that the visit must match'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner']).optional(),
});
const daySchema = z.object({
  dayId: z.string().trim().min(1),
  date: z.iso.date(),
  mode: z.enum(routingModes),
  visits: z.array(visitSchema).min(1).max(12),
  mealWindows: z
    .record(z.enum(['breakfast', 'lunch', 'dinner']), window)
    .optional()
    .describe(
      'Traveller-agreed meal windows; every supplied window is required',
    ),
});
export const validateItineraryInputSchema = z.object({
  days: z.array(daySchema).min(1).max(14),
});
interface CreateValidateItineraryToolOptions {
  tripId: string;
}
interface Issue {
  code: string;
  severity: 'conflict' | 'unchecked';
  dayId?: string;
  visitIndex?: number;
  message: string;
}

export function createValidateItineraryTool({
  tripId,
}: CreateValidateItineraryToolOptions) {
  return tool({
    description:
      'Validate grounded itinerary timing against routes, current opening hours, visit durations, fixed bookings, and traveller-agreed meal windows before approval.',
    inputSchema: validateItineraryInputSchema,
    execute: async ({ days }, { abortSignal }) => {
      const startedAt = performance.now();
      logger.info('validate_itinerary.started', {
        dayCount: days.length,
        tripId,
        visitCount: days.reduce((total, day) => total + day.visits.length, 0),
      });
      try {
        const apiKey = z
          .string()
          .trim()
          .min(1)
          .safeParse(Reflect.get(env, 'GEOAPIFY_API_KEY'));
        const placeIds = [
          ...new Set(
            days.flatMap((day) => day.visits.map((visit) => visit.placeId)),
          ),
        ];
        const records = await db
          .select({
            id: place.id,
            latitude: place.latitude,
            longitude: place.longitude,
            externalId: placeExternalId.externalId,
          })
          .from(placeExternalId)
          .innerJoin(place, eq(place.id, placeExternalId.placeId))
          .where(
            and(
              eq(placeExternalId.provider, 'geoapify'),
              inArray(placeExternalId.placeId, placeIds),
            ),
          );
        const byId = new Map(records.map((record) => [record.id, record]));
        const issues: Issue[] = days.flatMap((day) =>
          validateTimeline({ day }).map((issue) => ({
            ...issue,
            severity: 'conflict' as const,
          })),
        );
        for (const day of days) {
          day.visits.forEach((visit, index) => {
            if (!byId.has(visit.placeId))
              issues.push({
                code: 'place_unresolved',
                severity: 'unchecked',
                dayId: day.dayId,
                visitIndex: index,
                message: 'This canonical place could not be resolved.',
              });
          });
          for (const mealType of ['breakfast', 'lunch', 'dinner'] as const)
            if (
              day.mealWindows?.[mealType] &&
              !day.visits.some((visit) => visit.mealType === mealType)
            )
              issues.push({
                code: 'meal_missing',
                severity: 'conflict',
                dayId: day.dayId,
                message: `No ${mealType} visit was scheduled within the agreed window.`,
              });
        }
        for (const record of records) {
          const affected = days
            .flatMap((day) =>
              day.visits.map((visit, index) => ({ day, visit, index })),
            )
            .filter(({ visit }) => visit.placeId === record.id);
          if (!apiKey.success) {
            affected.forEach(({ day, index }) =>
              issues.push({
                code: 'opening_hours_unchecked',
                severity: 'unchecked',
                dayId: day.dayId,
                visitIndex: index,
                message: 'Opening hours provider is not configured.',
              }),
            );
            continue;
          }
          try {
            const result = await getGeoapifyPlaceOpeningHours({
              apiKey: apiKey.data,
              placeId: record.externalId,
              signal: abortSignal,
            });
            if (!result.available || !result.openingHours) {
              affected.forEach(({ day, index }) =>
                issues.push({
                  code: 'opening_hours_unchecked',
                  severity: 'unchecked',
                  dayId: day.dayId,
                  visitIndex: index,
                  message: 'Opening hours were unavailable or unparseable.',
                }),
              );
              continue;
            }
            affected.forEach(({ day, visit, index }) => {
              const evaluation = evaluateOpeningHours(
                result.openingHours!,
                day.date,
                visit.startTime,
                visit.endTime,
              );
              if (evaluation === 'closed')
                issues.push({
                  code: 'outside_opening_hours',
                  severity: 'conflict',
                  dayId: day.dayId,
                  visitIndex: index,
                  message:
                    'This visit falls outside current provider opening hours.',
                });
              if (evaluation === 'unchecked')
                issues.push({
                  code: 'opening_hours_unchecked',
                  severity: 'unchecked',
                  dayId: day.dayId,
                  visitIndex: index,
                  message: 'Opening hours use an unsupported format.',
                });
            });
          } catch {
            affected.forEach(({ day, index }) =>
              issues.push({
                code: 'opening_hours_unchecked',
                severity: 'unchecked',
                dayId: day.dayId,
                visitIndex: index,
                message: 'Opening hours could not be checked.',
              }),
            );
          }
        }
        for (const day of days) {
          const points = day.visits
            .map((visit) => byId.get(visit.placeId))
            .filter((point): point is NonNullable<typeof point> =>
              Boolean(point),
            );
          if (
            !apiKey.success ||
            points.length !== day.visits.length ||
            points.length < 2
          ) {
            issues.push({
              code: 'travel_time_unchecked',
              severity: 'unchecked',
              dayId: day.dayId,
              message: 'Travel times could not be checked for this day.',
            });
            continue;
          }
          try {
            const routes = await routeWithGeoapify({
              apiKey: apiKey.data,
              mode: day.mode,
              signal: abortSignal,
              waypoints: points,
            });
            routes.forEach((route, index) => {
              const gap =
                minutes(day.visits[index + 1].startTime) -
                minutes(day.visits[index].endTime);
              if (gap * 60 < route.durationSeconds)
                issues.push({
                  code: 'insufficient_travel_gap',
                  severity: 'conflict',
                  dayId: day.dayId,
                  visitIndex: index + 1,
                  message: `Travel between stops needs about ${Math.ceil(route.durationSeconds / 60)} minutes, leaving ${Math.max(0, gap)} minutes.`,
                });
            });
          } catch {
            issues.push({
              code: 'travel_time_unchecked',
              severity: 'unchecked',
              dayId: day.dayId,
              message: 'Travel times could not be checked for this day.',
            });
          }
        }
        const conflictCount = issues.filter(
          (issue) => issue.severity === 'conflict',
        ).length;
        const uncheckedCount = issues.length - conflictCount;
        logger.info('validate_itinerary.completed', {
          conflictCount,
          durationMs: elapsedMilliseconds(startedAt),
          tripId,
          uncheckedCount,
        });
        return {
          available: true as const,
          valid: conflictCount === 0,
          conflictCount,
          uncheckedCount,
          issues,
          attribution: {
            provider: 'Geoapify',
            dataSource: 'OpenStreetMap contributors',
          },
        };
      } catch (error) {
        logger.error('validate_itinerary.failed', error, {
          durationMs: elapsedMilliseconds(startedAt),
          tripId,
        });
        throw error;
      }
    },
  });
}
