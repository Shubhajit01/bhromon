import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import type { QueryClient } from '@tanstack/react-query';

import ms from 'ms';

import { ANCHOR_KEYS } from '#/config/anchor-keys';
import { COLLECTION } from '#/config/collection';
import { db } from '#/db/db.server';
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

  return db.query.trip.findMany({
    columns: {
      id: true,
      status: true,
      title: true,
      updatedAt: true,
    },
    where: {
      userId: user.id,
    },
    orderBy: {
      updatedAt: 'desc',
      id: 'desc',
    },
  });
});

export const getTripsQueryOptions = () =>
  queryOptions({
    staleTime: ms('1d'),
    queryKey: [ANCHOR_KEYS.CURRENT_USER, ANCHOR_KEYS.TRIP, COLLECTION.MANY],
    queryFn: ({ signal }) => getTrips({ signal }),
  });

export async function loadTrips(queryClient: QueryClient) {
  return queryClient.ensureQueryData(getTripsQueryOptions());
}

export function useTrips() {
  const { data } = useSuspenseQuery(getTripsQueryOptions());
  return data;
}

export function useInvalidateTrips() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries(getTripsQueryOptions());
}
