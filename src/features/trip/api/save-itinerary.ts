import { useMutation } from '@tanstack/react-query';
import { createServerFn, useServerFn } from '@tanstack/react-start';

import { createLogger, elapsedMilliseconds } from '#/lib/logger';

import { useInvalidateTrip } from './get-trip';
import { useInvalidateTrips } from './get-trips';
import { saveItineraryImplementation } from './save-itinerary.server';
import { saveItineraryInputSchema } from './save-itinerary-input';

import type { SaveItineraryInput } from './save-itinerary-input';

export { saveItineraryInputSchema } from './save-itinerary-input';
export type { SaveItineraryInput } from './save-itinerary-input';

const logger = createLogger('itinerary-save-client');

export const saveItinerary = createServerFn({ method: 'POST' })
  .validator(saveItineraryInputSchema)
  .handler(({ data }) => saveItineraryImplementation(data));

export function useSaveItinerary() {
  const saveItineraryServerFn = useServerFn(saveItinerary);
  const invalidateTrip = useInvalidateTrip();
  const invalidateTrips = useInvalidateTrips();

  return useMutation({
    mutationFn: async (data: SaveItineraryInput) => {
      const startedAt = performance.now();
      try {
        return await saveItineraryServerFn({ data });
      } catch (error) {
        logger.error('itinerary_save.client_failed', error, {
          durationMs: elapsedMilliseconds(startedAt),
          tripId: data.tripId,
        });
        throw error;
      }
    },
    onSuccess: (_, input) => {
      void invalidateTrip({ tripId: input.tripId });
      void invalidateTrips();
    },
  });
}
