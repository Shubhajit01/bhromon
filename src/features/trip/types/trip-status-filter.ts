import { z } from 'zod';

export const tripStatusFilterSchema = z.enum(['all', 'confirmed', 'draft']);

export type TripStatusFilter = z.infer<typeof tripStatusFilterSchema>;
