import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import type { QueryClient } from '@tanstack/react-query';

import ms from 'ms';
import { z } from 'zod';

import { ANCHOR_KEYS } from '#/config/anchor-keys';
import { COLLECTION } from '#/config/collection';
import { db } from '#/db/db.server';
import { getCurrentUser } from '#/features/auth/api/get-current-user';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';

import { TripNotFoundError } from '../errors/trip-not-found-error';
import { tripReadSchema } from '../schemas/itinerary/read';

const logger = createLogger('trip-query');

export const getTripInputSchema = z.object({
  tripId: z.string(),
});

export type GetTripInput = z.infer<typeof getTripInputSchema>;

export const getTrip = createServerFn({ method: 'GET' })
  .validator(getTripInputSchema)
  .handler(async ({ data }) => {
    const startedAt = performance.now();
    logger.info('trip_query.started', { tripId: data.tripId });
    const user = await getCurrentUser();

    if (!user) {
      logger.warn('trip_query.authentication_required', {
        tripId: data.tripId,
      });
      throw new Error('Authentication required to view trip');
    }

    const tripRecord = await db.query.trip.findFirst({
      where: {
        id: data.tripId,
        userId: user.id,
      },
      columns: {
        id: true,
        title: true,
        status: true,
      },
      with: {
        itineraryRevisions: {
          with: {
            days: {
              with: {
                highlights: true,
                visits: {
                  with: {
                    activities: true,
                    place: {
                      with: {
                        externalIds: true,
                      },
                    },
                  },
                },
              },
            },
            transitions: {
              with: {
                legs: true,
              },
            },
          },
        },
      },
    });

    if (!tripRecord) {
      logger.warn('trip_query.not_found', {
        durationMs: elapsedMilliseconds(startedAt),
        tripId: data.tripId,
      });
      throw new TripNotFoundError();
    }

    const result = tripReadSchema.parse({
      id: tripRecord.id,
      title: tripRecord.title,
      status: tripRecord.status,
      itineraryRevisions: tripRecord.itineraryRevisions.map((revision) => {
        return {
          id: revision.id,
          tripId: revision.tripId,
          revisionNumber: revision.revisionNumber,
          status: revision.status,
          destinationTimeZone: revision.destinationTimeZone,
          createdAt: revision.createdAt,
          confirmedAt: revision.confirmedAt,
          days: [...revision.days]
            .sort((left, right) => left.dayNumber - right.dayNumber)
            .map((day) => ({
              id: day.id,
              dayNumber: day.dayNumber,
              date: day.date,
              title: day.title,
              summary: day.summary,
              highlights: [...day.highlights]
                .sort((left, right) => left.position - right.position)
                .map((highlight) => highlight.text),
              visits: [...day.visits]
                .sort((left, right) => left.sequence - right.sequence)
                .map((visit) => ({
                  id: visit.id,
                  sequence: visit.sequence,
                  place: {
                    id: visit.place.id,
                    name: visit.place.name,
                    address: visit.place.address,
                    latitude: visit.place.latitude,
                    longitude: visit.place.longitude,
                    externalIds: [...visit.place.externalIds]
                      .sort((left, right) =>
                        left.provider.localeCompare(right.provider),
                      )
                      .map((externalId) => ({
                        provider: externalId.provider,
                        externalId: externalId.externalId,
                      })),
                  },
                  activities: [...visit.activities]
                    .sort((left, right) => left.position - right.position)
                    .map((activity) => ({
                      id: activity.id,
                      position: activity.position,
                      category: activity.category,
                      startTime: activity.startTime,
                      endTime: activity.endTime,
                      timeLabel: activity.timeLabel,
                      title: activity.title,
                      description: activity.description,
                    })),
                })),
            })),
          transitions: [...revision.transitions]
            .sort((left, right) => left.sequence - right.sequence)
            .map((transition) => ({
              id: transition.id,
              originVisitId: transition.originVisitId,
              destinationVisitId: transition.destinationVisitId,
              sequence: transition.sequence,
              status: transition.status,
              primaryMode: transition.primaryMode,
              distanceMeters: transition.distanceMeters,
              durationSeconds: transition.durationSeconds,
              provider: transition.provider,
              providerRouteId: transition.providerRouteId,
              encodedPolyline: transition.encodedPolyline,
              legs: [...transition.legs]
                .sort((left, right) => left.sequence - right.sequence)
                .map((leg) => ({
                  id: leg.id,
                  sequence: leg.sequence,
                  mode: leg.mode,
                  fromLabel: leg.fromLabel,
                  toLabel: leg.toLabel,
                  departureTime: leg.departureTime,
                  arrivalTime: leg.arrivalTime,
                  distanceMeters: leg.distanceMeters,
                  durationSeconds: leg.durationSeconds,
                  encodedPolyline: leg.encodedPolyline,
                })),
            })),
        };
      }),
    });

    logger.info('trip_query.completed', {
      confirmedRevisionCount: result.itineraryRevisions.filter(
        (revision) => revision.status === 'confirmed',
      ).length,
      durationMs: elapsedMilliseconds(startedAt),
      revisionCount: result.itineraryRevisions.length,
      tripId: data.tripId,
    });
    return result;
  });

export type Trip = NonNullable<Awaited<ReturnType<typeof getTrip>>>;

export const getTripQueryOptions = (input: GetTripInput) =>
  queryOptions({
    staleTime: ms('1d'),
    queryKey: [
      ANCHOR_KEYS.CURRENT_USER,
      ANCHOR_KEYS.TRIP,
      COLLECTION.ONE,
      input.tripId,
    ],
    queryFn: ({ signal }) => getTrip({ data: input, signal }),
  });

export async function loadTrip(queryClient: QueryClient, input: GetTripInput) {
  return queryClient.ensureQueryData(getTripQueryOptions(input));
}

export function useTrip(input: GetTripInput) {
  const { data } = useSuspenseQuery(getTripQueryOptions(input));
  return data;
}

export function useInvalidateTrip() {
  const queryClient = useQueryClient();
  return (input: GetTripInput) =>
    queryClient.invalidateQueries(getTripQueryOptions(input));
}
