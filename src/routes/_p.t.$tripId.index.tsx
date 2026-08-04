import { createFileRoute } from '@tanstack/react-router';

import { LinkButton } from '#/components/ui/button';

export const Route = createFileRoute('/_p/t/$tripId/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-8">
      <LinkButton to="/t/$tripId/chat">Open Chat</LinkButton>
    </div>
  );
}
