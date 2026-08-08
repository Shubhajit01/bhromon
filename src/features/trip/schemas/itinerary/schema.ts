import type { z } from 'zod';

import { itineraryV1Schema } from './v1';

export const itinerarySchema = itineraryV1Schema;

export type Itinerary = z.infer<typeof itinerarySchema>;
