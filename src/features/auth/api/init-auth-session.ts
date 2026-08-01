import { useMutation } from '@tanstack/react-query';

import { authClient } from '#/lib/auth-client';

export async function initAuthSession() {
  const { data: session, error: sessionError } = await authClient.getSession();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (session) {
    return;
  }

  const { error } = await authClient.signIn.anonymous();

  if (error) {
    throw new Error(error.message);
  }
}

export function useInitAuthSession() {
  return useMutation({
    mutationFn: initAuthSession,
  });
}
