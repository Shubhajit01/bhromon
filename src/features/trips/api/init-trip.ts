import { useMutation } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import { ulid } from 'ulid';
import { z } from 'zod';

import { getTripAgent } from '#/agents/trip-agent';
import { db, trip } from '#/db/db.server';
import { auth } from '#/lib/auth';

export const initTrip = createServerFn({ method: 'POST' })
  .validator(z.object({ prompt: z.string().trim().min(1).max(4_000) }))
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });

    if (!session) {
      throw new Error('Authentication required to create a trip');
    }

    const id = ulid();

    await db.insert(trip).values({
      id,
      userId: session.user.id,
      title: 'New trip',
      status: 'draft',
    });

    const tripAgent = await getTripAgent(id);
    await tripAgent.persistInitialPrompt(data.prompt);

    throw redirect({ to: '/trips/$tripId', params: { tripId: id } });
  });

export function useInitTrip() {
  const initTripServerFn = useServerFn(initTrip);

  return useMutation({
    mutationFn: initTripServerFn,
  });
}
