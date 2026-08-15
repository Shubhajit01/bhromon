import { getAgentByName } from 'agents';
import { env } from 'cloudflare:workers';

import { and, db, eq, trip } from '#/db/db.server';
import { auth } from '#/lib/auth';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';

import type { TripAgent } from './index';

interface RequireTripAgentAccessOptions {
  headers: Headers;
  tripId: string;
}

const logger = createLogger('trip-agent-access');

export class TripAgentAccessError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 404,
  ) {
    super(message);
    this.name = 'TripAgentAccessError';
  }
}

export async function requireTripAgentAccess({
  headers,
  tripId,
}: RequireTripAgentAccessOptions) {
  const startedAt = performance.now();
  const session = await auth.api.getSession({ headers });

  if (!session) {
    logger.warn('trip_agent_access.session_missing', {
      durationMs: elapsedMilliseconds(startedAt),
      tripId,
    });
    throw new TripAgentAccessError('Authentication required', 401);
  }

  const tripRecord = (
    await db
      .select()
      .from(trip)
      .where(and(eq(trip.id, tripId), eq(trip.userId, session.user.id)))
      .limit(1)
  ).at(0);

  if (!tripRecord) {
    logger.warn('trip_agent_access.trip_missing', {
      durationMs: elapsedMilliseconds(startedAt),
      tripId,
    });
    throw new TripAgentAccessError('Trip not found', 404);
  }

  logger.info('trip_agent_access.allowed', {
    durationMs: elapsedMilliseconds(startedAt),
    tripId,
  });

  return { trip: tripRecord, user: session.user };
}

export async function getAuthorizedTripAgent(
  options: RequireTripAgentAccessOptions,
) {
  await requireTripAgentAccess(options);
  return getAgentByName<Env, TripAgent>(env.TripAgent, options.tripId);
}
