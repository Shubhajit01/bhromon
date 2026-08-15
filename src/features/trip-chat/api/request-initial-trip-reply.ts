import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import { z } from 'zod';

import { getAuthorizedTripAgent } from '../agents/trip-agent/require-trip-agent-access.server';

export const requestInitialTripReplyInputSchema = z.object({
  tripId: z.string().trim().min(1),
});

export type RequestInitialTripReplyInput = z.infer<
  typeof requestInitialTripReplyInputSchema
>;

export const requestInitialTripReply = createServerFn({ method: 'POST' })
  .validator(requestInitialTripReplyInputSchema)
  .handler(async ({ data }) => {
    const tripAgent = await getAuthorizedTripAgent({
      headers: getRequestHeaders(),
      tripId: data.tripId,
    });

    const status = await tripAgent.ensureInitialReply();
    return { status };
  });
