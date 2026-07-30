import { createFileRoute } from '@tanstack/react-router';

import { seo } from '#/lib/seo';
import { Button } from '#/components/ui/button';

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: seo(),
  }),
});

function Home() {
  return (
    <div className="p-4">
      <h1 className="text-4xl font-fancy">Welcome to TanStack Start</h1>
      <Button>Submit</Button>
    </div>
  );
}
