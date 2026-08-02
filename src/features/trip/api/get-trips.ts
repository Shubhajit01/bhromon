import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import type { QueryClient } from '@tanstack/react-query';

import { ANCHOR_KEYS } from '#/config/anchor-keys';
import { COLLECTION } from '#/config/collection';
import { db, desc, eq, trip } from '#/db/db.server';
import { getCurrentUser } from '#/features/auth/api/get-current-user';

export interface TripListItem {
  id: string;
  status: 'draft' | 'confirmed';
  title: string;
  updatedAt: Date;
}

export const getTrips = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required to view trips');
  }

  return db
    .select({
      id: trip.id,
      status: trip.status,
      title: trip.title,
      updatedAt: trip.updatedAt,
    })
    .from(trip)
    .where(eq(trip.userId, user.id))
    .orderBy(desc(trip.updatedAt), desc(trip.id));
});

export const getTripsQueryOptions = () =>
  queryOptions({
    queryKey: [ANCHOR_KEYS.TRIP, COLLECTION.MANY],
    queryFn: ({ signal }) => getTrips({ signal }),
  });

export async function loadTrips(queryClient: QueryClient) {
  return queryClient.ensureQueryData(getTripsQueryOptions());
}

export function useTrips() {
  return useSuspenseQuery(getTripsQueryOptions());
}

export function useInvalidateTrips() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries(getTripsQueryOptions());
}
