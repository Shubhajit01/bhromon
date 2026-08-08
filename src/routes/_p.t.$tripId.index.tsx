import { createFileRoute } from '@tanstack/react-router';

import { LinkButton } from '#/components/ui/button';
import { loadTrip, useTrip } from '#/features/trip/api/get-trip';

export const Route = createFileRoute('/_p/t/$tripId/')({
  component: RouteComponent,
  loader({ context, params }) {
    void loadTrip(context.queryClient, { tripId: params.tripId });
  },
});

function RouteComponent() {
  const tripId = Route.useParams({ select: (s) => s.tripId });
  const trip = useTrip({ tripId });

  return (
    <div className="p-8">
      <LinkButton to="/t/$tripId/chat">Open Chat</LinkButton>
      <pre>{JSON.stringify(trip, null, 2)}</pre>
    </div>
  );
}
