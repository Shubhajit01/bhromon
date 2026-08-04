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
import { hashify } from '#/lib/utils';

import { UserNotAuthenticatedError } from '../errors/user-not-authenticated';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  isAnonymous: boolean | null | undefined;
  hash: string;
  image?: string | null;
}

export const getCurrentUser = createIsomorphicFn()
  .server(async (): Promise<CurrentUser | null> => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    const user = session?.user
      ? pick(session.user, ['name', 'email', 'id', 'image', 'isAnonymous'])
      : null;
    return user ? { ...user, hash: await hashify(user.id) } : null;
  })
  .client(async (): Promise<CurrentUser | null> => {
    const { data } = await authClient.getSession();
    const user = data?.user
      ? pick(data.user, ['name', 'email', 'id', 'image', 'isAnonymous'])
      : null;
    return user ? { ...user, hash: await hashify(user.id) } : null;
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
