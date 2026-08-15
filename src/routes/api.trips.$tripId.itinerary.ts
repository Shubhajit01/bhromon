import { createFileRoute } from '@tanstack/react-router';

import {
  saveItineraryImplementation,
  UnresolvedItineraryPlacesError,
} from '#/features/trip/api/save-itinerary.server';
import { saveItineraryInputSchema } from '#/features/trip/api/save-itinerary-input';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';

const logger = createLogger('itinerary-api');

const saveItineraryRequestSchema = saveItineraryInputSchema.pick({
  itinerary: true,
});

export const Route = createFileRoute('/api/trips/$tripId/itinerary')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const startedAt = performance.now();
        try {
          const body = saveItineraryRequestSchema.parse(await request.json());
          const input = saveItineraryInputSchema.parse({
            ...body,
            tripId: params.tripId,
          });
          const revision = await saveItineraryImplementation(input);

          return Response.json(revision, {
            status: 201,
            headers: { 'Cache-Control': 'no-store' },
          });
        } catch (error) {
          if (error instanceof UnresolvedItineraryPlacesError) {
            logger.warn('itinerary_api.unresolved_places', {
              durationMs: elapsedMilliseconds(startedAt),
              status: 422,
              tripId: params.tripId,
              unresolvedPlaceCount: error.placeIds.length,
            });
            return Response.json(
              {
                error: 'unresolved_places',
                message: error.message,
                placeIds: error.placeIds,
              },
              { status: 422 },
            );
          }

          logger.error('itinerary_api.request_failed', error, {
            durationMs: elapsedMilliseconds(startedAt),
            tripId: params.tripId,
          });
          throw error;
        }
      },
    },
  },
});
