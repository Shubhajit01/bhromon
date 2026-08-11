import { useMutation } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import { ulid } from 'ulid';
import { z } from 'zod';

import { db, trip } from '#/db/db.server';
import { getCurrentUser } from '#/features/auth/api/get-current-user';
import { useInitAuthSession } from '#/features/auth/api/init-auth-session';
import { getAuthorizedTripAgent } from '#/features/trip-chat/agents/trip-agent/require-trip-agent-access.server';
import { getUserTimeZone } from '#/utils/user-time-zone';

import { generateTripTitle } from './generate-trip-title';
import { useInvalidateTrips } from './get-trips';

export const MIN_PROMPT_LENGTH = 50;
export const MAX_PROMPT_LENGTH = 4000;
export const MAX_FALLBACK_TITLE_LENGTH = 32;

export const initTripInputSchema = z.object({
  prompt: z.string().trim().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH),
});

export type InitTripInput = z.infer<typeof initTripInputSchema>;

export const initTrip = createServerFn({ method: 'POST' })
  .validator(initTripInputSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Authentication required to create a trip');
    }

    const id = ulid();

    const title = await getTripTitle(data.prompt);

    await db.insert(trip).values({
      id,
      userId: user.id,
      title,
      status: 'draft',
    });

    const tripAgent = await getAuthorizedTripAgent({
      headers: getRequestHeaders(),
      tripId: id,
    });
    await tripAgent.persistInitialPrompt(data.prompt, getUserTimeZone());

    throw redirect({ to: '/t/$tripId/chat', params: { tripId: id } });
  });

async function getTripTitle(prompt: string) {
  try {
    const title = await generateTripTitle({ data: { prompt } });

    if (title.trim()) {
      return title.trim();
    }
  } catch {
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

  const invalidateTrips = useInvalidateTrips();

  return useMutation({
    mutationFn: async (data: InitTripInput) => {
      await initAuthSession.mutateAsync();
      return initTripServerFn({ data });
    },
    onSuccess: () => {
      void invalidateTrips();
    },
  });
}
