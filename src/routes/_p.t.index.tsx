import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_p/t/')({
  beforeLoad: () => {
    throw redirect({
      to: '/t/trips',
      replace: true,
    });
  },
});
