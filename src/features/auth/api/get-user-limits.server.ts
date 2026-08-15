import { db, eq, sql, trip } from '#/db/db.server';

import { getCurrentUser } from './get-current-user';

import type { UserLimits } from './user-limits';

const GUEST_SAVED_TRIP_LIMIT = 3;

export async function getUserLimitsImplementation(): Promise<UserLimits> {
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
}
