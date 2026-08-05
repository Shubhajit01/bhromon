import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import type { QueryClient } from '@tanstack/react-query';

import { z } from 'zod';

import { getTripAgent } from '#/agents/trip-agent';
import { ANCHOR_KEYS } from '#/config/anchor-keys';
import { COLLECTION } from '#/config/collection';

export const getTripMessagesInputSchema = z.object({
  tripId: z.string(),
});

export type GetTripMessagesInput = z.infer<typeof getTripMessagesInputSchema>;

export const getTripMessages = createServerFn({ method: 'GET' })
  .validator(getTripMessagesInputSchema)
  .handler(async ({ data }) => {
    const agent = await getTripAgent(data.tripId);
    return agent.getMessages();
  });

export const getTripMessagesQueryOptions = (input: GetTripMessagesInput) =>
  queryOptions({
    queryKey: [ANCHOR_KEYS.TRIP, 'messages', COLLECTION.MANY, input.tripId],
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
