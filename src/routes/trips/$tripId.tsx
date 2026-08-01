import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/trips/$tripId')({
  component: Trip,
});

function Trip() {
  const { tripId } = Route.useParams();

  return <main className="p-6">Your trip is being planned: {tripId}</main>;
}
