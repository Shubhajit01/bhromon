import { createFileRoute, redirect } from '@tanstack/react-router';

import { loadCurrentUser } from '#/features/auth/api/get-current-user';

export const Route = createFileRoute('/_protected')({
  async beforeLoad({ context }) {
    const user = await loadCurrentUser(context.queryClient);
    if (!user) {
      throw redirect({
        to: '/',
        replace: true,
      });
    }
  },
});
