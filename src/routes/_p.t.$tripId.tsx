import { createFileRoute } from '@tanstack/react-router';

import { loadTrip } from '#/features/trip/api/get-trip';

export const Route = createFileRoute('/_p/t/$tripId')({
  async loader({ params, context }) {
    void loadTrip(context.queryClient, { tripId: params.tripId });
  },
});
