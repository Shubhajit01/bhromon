import { z } from 'zod';

import { isSupportedTimeZone } from '#/utils/user-time-zone';

const itineraryIdSchema = z.string().trim().min(1);
const itineraryTextSchema = z.string().trim().min(1);
const itineraryTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm');
const itineraryTimeZoneSchema = itineraryTextSchema.refine(
  isSupportedTimeZone,
  { message: 'Time zone must be a valid IANA time zone' },
);

export const itineraryActivityInputSchema = z
  .object({
    id: itineraryIdSchema,
    category: itineraryTextSchema.optional(),
    startTime: itineraryTimeSchema.optional(),
    endTime: itineraryTimeSchema.optional(),
    timeLabel: itineraryTextSchema.optional(),
    title: itineraryTextSchema,
    description: itineraryTextSchema.optional(),
  })
  .superRefine((activity, context) => {
    if (!activity.startTime && !activity.timeLabel) {
      context.addIssue({
        code: 'custom',
        message: 'An exact start time or a flexible time label is required',
        path: ['startTime'],
      });
    }

    if (activity.endTime && !activity.startTime) {
      context.addIssue({
        code: 'custom',
        message: 'An end time requires an exact start time',
        path: ['endTime'],
      });
    }
  });

export const itineraryVisitInputSchema = z.object({
  id: itineraryIdSchema,
  placeId: itineraryIdSchema.describe(
    'Canonical internal place ID returned by searchPlaces',
  ),
  activities: z.array(itineraryActivityInputSchema).min(1),
});

export const itineraryDayInputSchema = z.object({
  id: itineraryIdSchema,
  dayNumber: z.number().int().positive(),
  date: z.iso.date().optional(),
  title: itineraryTextSchema,
  summary: itineraryTextSchema,
  highlights: z.array(itineraryTextSchema).min(1),
  visits: z.array(itineraryVisitInputSchema).min(1),
});

export const itinerarySaveSchema = z
  .object({
    destinationTimeZone: itineraryTimeZoneSchema.optional(),
    days: z.array(itineraryDayInputSchema).min(1),
  })
  .superRefine((itinerary, context) => {
    const dayIds = new Set<string>();
    const visitIds = new Set<string>();
    const activityIds = new Set<string>();

    itinerary.days.forEach((day, dayIndex) => {
      if (day.dayNumber !== dayIndex + 1) {
        context.addIssue({
          code: 'custom',
          message: 'Day numbers must be sequential and match their order',
          path: ['days', dayIndex, 'dayNumber'],
        });
      }

      if (dayIds.has(day.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Day IDs must be unique within an itinerary',
          path: ['days', dayIndex, 'id'],
        });
      }
      dayIds.add(day.id);

      day.visits.forEach((visit, visitIndex) => {
        if (visitIds.has(visit.id)) {
          context.addIssue({
            code: 'custom',
            message: 'Visit IDs must be unique within an itinerary',
            path: ['days', dayIndex, 'visits', visitIndex, 'id'],
          });
        }
        visitIds.add(visit.id);

        visit.activities.forEach((activity, activityIndex) => {
          if (activityIds.has(activity.id)) {
            context.addIssue({
              code: 'custom',
              message: 'Activity IDs must be unique within an itinerary',
              path: [
                'days',
                dayIndex,
                'visits',
                visitIndex,
                'activities',
                activityIndex,
                'id',
              ],
            });
          }
          activityIds.add(activity.id);
        });
      });
    });
  });

export type ItinerarySaveInput = z.infer<typeof itinerarySaveSchema>;
