import { useMutation } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ulid } from 'ulid';
import { z } from 'zod';

import { getTripAgent } from '#/agents/trip-agent';
import { db, trip } from '#/db/db.server';

export const initTrip = createServerFn({ method: 'POST' })
  .validator(z.object({ prompt: z.string().trim().min(1).max(4_000) }))
  .handler(async ({ data }) => {
    const id = ulid();

    await db.insert(trip).values({
      id,
      title: 'New trip',
      status: 'draft',
    });

    const tripAgent = await getTripAgent(id);
    await tripAgent.persistInitialPrompt(data.prompt);

    throw redirect({ to: '/trips/$tripId', params: { tripId: id } });
  });

export function useInitTrip() {
  return useMutation({
    mutationFn: initTrip,
  });
}
