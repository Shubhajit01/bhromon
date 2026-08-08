import { tool } from 'ai';
import { z } from 'zod';

import type { UIToolInvocation } from 'ai';

import { saveItinerary } from '#/features/trip/api/save-itinerary';
import { itinerarySchema } from '#/features/trip/schemas/itinerary/schema';

export const saveItineraryToolInputSchema = z.object({
  itinerary: itinerarySchema.describe(
    'The complete, traveller-confirmed itinerary. Preserve every agreed day, highlight, time, and location.',
  ),
});

interface CreateSaveItineraryToolOptions {
  tripId: string;
}

export function createSaveItineraryTool({
  tripId,
}: CreateSaveItineraryToolOptions) {
  return tool({
    description:
      'Save the complete itinerary for this trip. Call this only after all material details have been resolved, the final itinerary has been shown to the traveller, and the traveller has explicitly confirmed that it is ready to save. The user must approve the save before it executes.',
    inputSchema: saveItineraryToolInputSchema,
    execute: ({ itinerary }) => saveItinerary({ data: { tripId, itinerary } }),
  });
}

export type SaveItineraryToolInvocation = UIToolInvocation<
  ReturnType<typeof createSaveItineraryTool>
>;
