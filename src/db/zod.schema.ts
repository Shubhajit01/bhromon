import { createSelectSchema } from 'drizzle-orm/zod';

import {
  itineraryActivity,
  itineraryDay,
  itineraryRevision,
  itineraryRouteLeg,
  itineraryTransition,
  place,
  placeExternalId,
  placeVisit,
  trip,
} from './schema';

export const tripRowSchema = createSelectSchema(trip);
export const itineraryRevisionRowSchema =
  createSelectSchema(itineraryRevision);
export const itineraryDayRowSchema = createSelectSchema(itineraryDay);
export const placeRowSchema = createSelectSchema(place);
export const placeExternalIdRowSchema = createSelectSchema(placeExternalId);
export const placeVisitRowSchema = createSelectSchema(placeVisit);
export const itineraryActivityRowSchema =
  createSelectSchema(itineraryActivity);
export const itineraryTransitionRowSchema =
  createSelectSchema(itineraryTransition);
export const itineraryRouteLegRowSchema =
  createSelectSchema(itineraryRouteLeg);
