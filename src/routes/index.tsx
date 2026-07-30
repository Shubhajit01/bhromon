import { Button } from '#/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="p-4">
      <h1 className="text-4xl font-fancy">Welcome to TanStack Start</h1>
      <Button>Submit</Button>
    </div>
  );
}
