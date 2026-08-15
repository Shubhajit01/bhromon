import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import type { QueryClient } from '@tanstack/react-query';

import { z } from 'zod';

import { ANCHOR_KEYS } from '#/config/anchor-keys';
import { COLLECTION } from '#/config/collection';
import { getAuthorizedTripAgent } from '#/features/trip-chat/agents/trip-agent/require-trip-agent-access.server';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';

const logger = createLogger('trip-messages');

export const getTripMessagesInputSchema = z.object({
  tripId: z.string(),
});

export type GetTripMessagesInput = z.infer<typeof getTripMessagesInputSchema>;

export const getTripMessages = createServerFn({ method: 'GET' })
  .validator(getTripMessagesInputSchema)
  .handler(async ({ data }) => {
    const startedAt = performance.now();
    logger.info('trip_messages.load_started', { tripId: data.tripId });
    const agent = await getAuthorizedTripAgent({
      headers: getRequestHeaders(),
      tripId: data.tripId,
    });
    // @ts-ignore TODO: Check once
    const messages = agent.getMessages() as any;
    logger.info('trip_messages.load_completed', {
      durationMs: elapsedMilliseconds(startedAt),
      messageCount: Array.isArray(messages) ? messages.length : undefined,
      tripId: data.tripId,
    });
    return messages;
  });

export const getTripMessagesQueryOptions = (input: GetTripMessagesInput) =>
  queryOptions({
    queryKey: [
      ANCHOR_KEYS.CURRENT_USER,
      ANCHOR_KEYS.TRIP,
      'messages',
      COLLECTION.MANY,
      input.tripId,
    ],
    queryFn: ({ signal }) => getTripMessages({ data: input, signal }),
  });

export async function loadTripMessages(
  queryClient: QueryClient,
  input: GetTripMessagesInput,
) {
  return queryClient.ensureQueryData(getTripMessagesQueryOptions(input));
}

export function useTripMessages(input: GetTripMessagesInput) {
  const { data } = useSuspenseQuery(getTripMessagesQueryOptions(input));
  return data;
}

export function useInvalidateTripMessages() {
  const queryClient = useQueryClient();
  return (input: GetTripMessagesInput) =>
    queryClient.invalidateQueries(getTripMessagesQueryOptions(input));
}
