import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import type { QueryClient } from '@tanstack/react-query';

import { ANCHOR_KEYS } from '#/config/anchor-keys';
import { COLLECTION } from '#/config/collection';
import { db, eq, sql, trip } from '#/db/db.server';

import { getCurrentUser } from './get-current-user';

const GUEST_SAVED_TRIP_LIMIT = 3;

export interface SavedTripLimit {
  canCreate: boolean;
  limit: number;
  remaining: number;
}

export interface UserLimits {
  savedTrips: SavedTripLimit | null;
}

export const getUserLimits = createServerFn({ method: 'GET' }).handler(
  async (): Promise<UserLimits> => {
    const user = await getCurrentUser();

    if (!user?.isAnonymous) {
      return { savedTrips: null };
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(trip)
      .where(eq(trip.userId, user.id));
    const savedTripCount = result.at(0)?.count ?? 0;

    return {
      savedTrips: {
        canCreate: savedTripCount < GUEST_SAVED_TRIP_LIMIT,
        limit: GUEST_SAVED_TRIP_LIMIT,
        remaining: Math.max(GUEST_SAVED_TRIP_LIMIT - savedTripCount, 0),
      },
    };
  },
);

export const getUserLimitsQueryOptions = () =>
  queryOptions({
    queryKey: [ANCHOR_KEYS.CURRENT_USER, COLLECTION.LIMITS],
    queryFn: ({ signal }) => getUserLimits({ signal }),
  });

export async function loadUserLimits(queryClient: QueryClient) {
  return queryClient.ensureQueryData(getUserLimitsQueryOptions());
}

export function useUserLimits() {
  const { data } = useSuspenseQuery(getUserLimitsQueryOptions());
  return data;
}

export function useInvalidateUserLimits() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries(getUserLimitsQueryOptions());
}
