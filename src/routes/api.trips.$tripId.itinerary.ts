import { createFileRoute } from '@tanstack/react-router';

import {
  saveItinerary,
  saveItineraryInputSchema,
} from '#/features/trip/api/save-itinerary';

const saveItineraryRequestSchema = saveItineraryInputSchema.pick({
  itinerary: true,
});

export const Route = createFileRoute('/api/trips/$tripId/itinerary')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const body = saveItineraryRequestSchema.parse(await request.json());
        const input = saveItineraryInputSchema.parse({
          ...body,
          tripId: params.tripId,
        });
        const revision = await saveItinerary({ data: input });

        return Response.json(revision, {
          status: 201,
          headers: { 'Cache-Control': 'no-store' },
        });
      },
    },
  },
});
