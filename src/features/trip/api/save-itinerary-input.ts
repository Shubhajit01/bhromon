import { z } from 'zod';

import { itinerarySaveSchema } from '../schemas/itinerary/save';

export const saveItineraryInputSchema = z.object({
  tripId: z.string().trim().min(1),
  itinerary: itinerarySaveSchema,
});

export type SaveItineraryInput = z.infer<typeof saveItineraryInputSchema>;
