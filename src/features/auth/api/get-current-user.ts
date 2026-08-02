import {
  queryOptions,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

import type { QueryClient } from '@tanstack/react-query';

import { pick } from 'es-toolkit';
import ms from 'ms';

import { ANCHOR_KEYS } from '#/config/anchor-keys';
import { auth } from '#/lib/auth';
import { authClient } from '#/lib/auth-client';

import { UserNotAuthenticatedError } from '../errors/user-not-authenticated';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  isAnonymous: boolean | null | undefined;
  image?: string | null;
}

export const getCurrentUser = createIsomorphicFn()
  .server(async (): Promise<CurrentUser | null> => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    return session?.user
      ? pick(session.user, ['name', 'email', 'id', 'image', 'isAnonymous'])
      : null;
  })
  .client(async (): Promise<CurrentUser | null> => {
    const { data } = await authClient.getSession();
    return data?.user
      ? pick(data.user, ['name', 'email', 'id', 'image', 'isAnonymous'])
      : null;
  });

export const getCurrentUserOptions = () =>
  queryOptions({
    staleTime: ms('1h'),
    queryKey: [ANCHOR_KEYS.CURRENT_USER],
    queryFn: () => getCurrentUser(),
  });

export async function loadCurrentUser(queryClient: QueryClient) {
  return queryClient.ensureQueryData(getCurrentUserOptions());
}

export function useIsAuthenticated() {
  const { data } = useSuspenseQuery({
    ...getCurrentUserOptions(),
    select: (d) => !!d,
  });
  return data;
}

export function useMaybeCurrentUser<T = CurrentUser | null>(
  selector?: (d: CurrentUser | null) => T,
): T {
  const { data } = useSuspenseQuery({
    ...getCurrentUserOptions(),
    select: (d) => (selector ? selector(d) : d),
  });
  return data as T;
}

export function useCurrentUser<T = CurrentUser>(
  selector?: (d: CurrentUser) => T,
): T {
  const user = useMaybeCurrentUser((d) => {
    if (!d) {
      throw new UserNotAuthenticatedError();
    }
    return selector ? selector(d) : d;
  });

  return user as T;
}

export function useInvalidateCurrentUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries(getCurrentUserOptions());
}
