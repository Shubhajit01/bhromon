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

import { TripNotFoundError } from '../errors/trip-not-found-error';
import { itineraryV1Schema } from '../schemas/itinerary/v1';

export const getTripInputSchema = z.object({
  tripId: z.string(),
});

export type GetTripInput = z.infer<typeof getTripInputSchema>;

export const getTrip = createServerFn({ method: 'GET' })
  .validator(getTripInputSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    if (!user) {
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
        itineraryRevisions: true,
      },
    });

    if (!tripRecord) {
      throw new TripNotFoundError();
    }

    return {
      ...tripRecord,
      itineraryRevisions: tripRecord.itineraryRevisions.map((it) => ({
        ...it,
        content: itineraryV1Schema.parse(it.content),
      })),
    };
  });

export type Trip = NonNullable<Awaited<ReturnType<typeof getTrip>>>;

export const getTripQueryOptions = (input: GetTripInput) =>
  queryOptions({
    staleTime: ms('1d'),
    queryKey: [ANCHOR_KEYS.TRIP, COLLECTION.ONE, input.tripId],
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
