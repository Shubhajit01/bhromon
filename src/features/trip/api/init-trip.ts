import { useMutation } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';

import { ulid } from 'ulid';
import { z } from 'zod';

import { getTripAgent } from '#/agents/trip-agent';
import { db, trip } from '#/db/db.server';
import { getCurrentUser } from '#/features/auth/api/get-current-user';
import { useInitAuthSession } from '#/features/auth/api/init-auth-session';

import { generateTripTitle } from './generate-trip-title';
import { useInvalidateTrips } from './get-trips';

export const MIN_PROMPT_LENGTH = 50;
export const MAX_PROMPT_LENGTH = 4000;

export const initTripInputSchema = z.object({
  prompt: z.string().trim().min(MIN_PROMPT_LENGTH).max(MAX_PROMPT_LENGTH),
});

type InitTripInput = z.infer<typeof initTripInputSchema>;

export const initTrip = createServerFn({ method: 'POST' })
  .validator(initTripInputSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Authentication required to create a trip');
    }

    const id = ulid();

    const title = await generateTripTitle({
      data: { prompt: data.prompt },
    });

    await db.insert(trip).values({
      id,
      userId: user.id,
      title,
      status: 'draft',
    });

    const tripAgent = await getTripAgent(id);
    await tripAgent.persistInitialPrompt(data.prompt);

    throw redirect({ to: '/t/$tripId', params: { tripId: id } });
  });

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
