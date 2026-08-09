import { createServerFn } from '@tanstack/react-start';

import { z } from 'zod';

import { db, eq, trip } from '#/db/db.server';

export const linkAnonymousUserInputSchema = z.object({
  anonymousUserId: z.string().trim().min(1),
  newUserId: z.string().trim().min(1),
});

export type LinkAnonymousUserInput = z.infer<
  typeof linkAnonymousUserInputSchema
>;

export const linkAnonymousUser = createServerFn({ method: 'POST' })
  .validator(linkAnonymousUserInputSchema)
  .handler(async ({ data }) => {
    await db
      .update(trip)
      .set({ userId: data.newUserId })
      .where(eq(trip.userId, data.anonymousUserId));
  });
