import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import type { QueryClient } from '@tanstack/react-query';

import { ANCHOR_KEYS } from '#/config/anchor-keys';
import { COLLECTION } from '#/config/collection';

import { getUserLimitsImplementation } from './get-user-limits.server';

export type { SavedTripLimit, UserLimits } from './user-limits';

export const getUserLimits = createServerFn({ method: 'GET' }).handler(
  getUserLimitsImplementation,
);

export const getUserLimitsQueryOptions = () =>
  queryOptions({
    queryKey: [ANCHOR_KEYS.CURRENT_USER, COLLECTION.LIMITS],
    queryFn: ({ signal }) => getUserLimits({ signal }),
  });

export async function loadUserLimits(queryClient: QueryClient) {
  return queryClient.ensureQueryData(getUserLimitsQueryOptions());
}

export function useUserLimits() {
  const { data } = useSuspenseQuery(getUserLimitsQueryOptions());
  return data;
}

export function useInvalidateUserLimits() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries(getUserLimitsQueryOptions());
}
