import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import { ulid } from 'ulid';
import { z } from 'zod';

import { db, eq, trip } from '#/db/db.server';
import {
  getCurrentUser,
  useInvalidateCurrentUser,
} from '#/features/auth/api/get-current-user';
import { useInvalidateUserLimits } from '#/features/auth/api/get-user-limits';
import { getUserLimitsImplementation } from '#/features/auth/api/get-user-limits.server';
import { useInitAuthSession } from '#/features/auth/api/init-auth-session';
import { getAuthorizedTripAgent } from '#/features/trip-chat/agents/trip-agent/require-trip-agent-access.server';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';
import { getUserTimeZone } from '#/utils/user-time-zone';

import { GuestTripLimitError } from '../errors/guest-trip-limit-error';
import { generateTripTitle } from './generate-trip-title.server';
import { useInvalidateTrips } from './get-trips';

export const MIN_PROMPT_LENGTH = 50;
export const MAX_PROMPT_LENGTH = 4000;
export const MAX_FALLBACK_TITLE_LENGTH = 32;
const logger = createLogger('trip-init');

export const initTripInputSchema = z.object({
  diagnosticId: z.string().uuid().optional(),
  prompt: z.string().trim().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH),
});

export type InitTripInput = z.infer<typeof initTripInputSchema>;

export const initTrip = createServerFn({ method: 'POST' })
  .validator(initTripInputSchema)
  .handler(async ({ data }) => {
    const startedAt = performance.now();
    logger.info('trip_init.started', {
      diagnosticId: data.diagnosticId,
      promptLength: data.prompt.length,
    });

    const user = await getCurrentUser();

    if (!user) {
      logger.warn('trip_init.authentication_required', {
        diagnosticId: data.diagnosticId,
      });
      throw new Error('Authentication required to create a trip');
    }

    const userLimits = await getUserLimitsImplementation();

    if (userLimits.savedTrips && !userLimits.savedTrips.canCreate) {
      logger.warn('trip_init.guest_limit_reached', {
        diagnosticId: data.diagnosticId,
      });
      throw new GuestTripLimitError();
    }

    const id = ulid();

    const title = await getTripTitle(data.prompt, data.diagnosticId);
    await db.insert(trip).values({
      id,
      userId: user.id,
      title,
      status: 'draft',
    });
    try {
      const tripAgent = await getAuthorizedTripAgent({
        headers: getRequestHeaders(),
        tripId: id,
      });
      await tripAgent.persistInitialPrompt(data.prompt, getUserTimeZone());
    } catch (error) {
      await db.delete(trip).where(eq(trip.id, id));
      logger.error('trip_init.rolled_back', error, {
        diagnosticId: data.diagnosticId,
        tripId: id,
      });
      throw error;
    }

    logger.info('trip_init.completed', {
      diagnosticId: data.diagnosticId,
      durationMs: elapsedMilliseconds(startedAt),
      tripId: id,
    });

    return { tripId: id };
  });

async function getTripTitle(prompt: string, diagnosticId?: string) {
  try {
    const title = await generateTripTitle({ diagnosticId, prompt });

    if (title.trim()) {
      return title.trim();
    }
    logger.warn('trip_init.title_empty', { diagnosticId });
  } catch (error) {
    logger.error('trip_init.title_fallback_used', error, { diagnosticId });
    // A title should not prevent a traveller from starting to plan.
  }

  return getFallbackTripTitle(prompt);
}

function getFallbackTripTitle(prompt: string) {
  const normalizedPrompt = prompt.replace(/\s+/g, ' ').trim();

  if (normalizedPrompt.length <= MAX_FALLBACK_TITLE_LENGTH) {
    return normalizedPrompt;
  }

  return `${normalizedPrompt
    .slice(0, MAX_FALLBACK_TITLE_LENGTH - 1)
    .trimEnd()}…`;
}

export function useInitTrip() {
  const initAuthSession = useInitAuthSession();
  const initTripServerFn = useServerFn(initTrip);
  const navigate = useNavigate();

  const invalidateTrips = useInvalidateTrips();
  const invalidateUserLimits = useInvalidateUserLimits();
  const invalidateCurrentUser = useInvalidateCurrentUser();

  return useMutation({
    mutationFn: async (data: InitTripInput) => {
      const diagnosticId = data.diagnosticId ?? crypto.randomUUID();
      const startedAt = performance.now();
      logger.info('trip_init.client_started', {
        diagnosticId,
        promptLength: data.prompt.length,
      });
      await initAuthSession.mutateAsync();
      try {
        const result = await initTripServerFn({
          data: { ...data, diagnosticId },
        });
        logger.info('trip_init.client_completed', {
          diagnosticId,
          durationMs: elapsedMilliseconds(startedAt),
        });
        return result;
      } catch (error) {
        logger.error('trip_init.client_failed', error, {
          diagnosticId,
          durationMs: elapsedMilliseconds(startedAt),
        });
        throw error;
      }
    },
    onSuccess: async ({ tripId }) => {
      void invalidateTrips();
      void invalidateUserLimits();
      await invalidateCurrentUser();
      return navigate({ to: '/t/$tripId/chat', params: { tripId } });
    },
  });
}
