import { z } from 'zod';

import {
  itineraryActivityRowSchema,
  itineraryDayRowSchema,
  itineraryRevisionRowSchema,
  itineraryRouteLegRowSchema,
  itineraryTransitionRowSchema,
  placeExternalIdRowSchema,
  placeRowSchema,
  placeVisitRowSchema,
  tripRowSchema,
} from '#/db/zod.schema';

export const itineraryPlaceExternalIdSchema =
  placeExternalIdRowSchema.pick({
    provider: true,
    externalId: true,
  });

export const itineraryPlaceSchema = placeRowSchema
  .pick({
    id: true,
    name: true,
    address: true,
    latitude: true,
    longitude: true,
  })
  .extend({
    externalIds: z.array(itineraryPlaceExternalIdSchema),
  });

export const itineraryActivitySchema = itineraryActivityRowSchema.pick({
  id: true,
  position: true,
  category: true,
  startTime: true,
  endTime: true,
  timeLabel: true,
  title: true,
  description: true,
});

export const itineraryVisitSchema = placeVisitRowSchema
  .pick({
    id: true,
    sequence: true,
  })
  .extend({
    place: itineraryPlaceSchema,
    activities: z.array(itineraryActivitySchema),
  });

export const itineraryDaySchema = itineraryDayRowSchema
  .pick({
    id: true,
    dayNumber: true,
    date: true,
    title: true,
    summary: true,
  })
  .extend({
    highlights: z.array(z.string()),
    visits: z.array(itineraryVisitSchema),
  });

export const itineraryRouteLegSchema = itineraryRouteLegRowSchema.pick({
  id: true,
  sequence: true,
  mode: true,
  fromLabel: true,
  toLabel: true,
  departureTime: true,
  arrivalTime: true,
  distanceMeters: true,
  durationSeconds: true,
  encodedPolyline: true,
});

export const itineraryTransitionSchema = itineraryTransitionRowSchema
  .pick({
    id: true,
    originVisitId: true,
    destinationVisitId: true,
    sequence: true,
    status: true,
    primaryMode: true,
    distanceMeters: true,
    durationSeconds: true,
    provider: true,
    providerRouteId: true,
    encodedPolyline: true,
  })
  .extend({
    legs: z.array(itineraryRouteLegSchema),
  });

export const itineraryRevisionReadSchema = itineraryRevisionRowSchema
  .pick({
    id: true,
    tripId: true,
    revisionNumber: true,
    status: true,
    destinationTimeZone: true,
    createdAt: true,
    confirmedAt: true,
  })
  .extend({
    days: z.array(itineraryDaySchema),
    transitions: z.array(itineraryTransitionSchema),
  });

export const tripReadSchema = tripRowSchema
  .pick({
    id: true,
    title: true,
    status: true,
  })
  .extend({
    itineraryRevisions: z.array(itineraryRevisionReadSchema),
  });

export type ItineraryDay = z.infer<typeof itineraryDaySchema>;
export type ItineraryActivity = z.infer<typeof itineraryActivitySchema>;
