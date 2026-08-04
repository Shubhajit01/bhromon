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
import { and, db, eq, trip } from '#/db/db.server';
import { getCurrentUser } from '#/features/auth/api/get-current-user';

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

    const [tripRecord] = await db
      .select()
      .from(trip)
      .where(and(eq(trip.id, data.tripId), eq(trip.userId, user.id)))
      .limit(1);

    return tripRecord;
  });

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
