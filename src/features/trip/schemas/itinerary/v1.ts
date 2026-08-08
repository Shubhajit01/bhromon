import { z } from 'zod';

const itineraryIdSchema = z.string().trim().min(1);
const itineraryTextSchema = z.string().trim().min(1);
const itineraryTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm');
const itineraryTimeZoneSchema = itineraryTextSchema.refine(
  (timeZone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Time zone must be a valid IANA time zone' },
);

export const itineraryLocationV1Schema = z.object({
  name: itineraryTextSchema,
  address: itineraryTextSchema.optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  providerPlaceId: itineraryTextSchema.optional(),
});

export const itineraryItemV1Schema = z
  .object({
    id: itineraryIdSchema,
    startTime: itineraryTimeSchema.optional(),
    endTime: itineraryTimeSchema.optional(),
    timeLabel: itineraryTextSchema.optional(),
    title: itineraryTextSchema,
    description: itineraryTextSchema.optional(),
    location: itineraryLocationV1Schema,
  })
  .superRefine((item, context) => {
    if (!item.startTime && !item.timeLabel) {
      context.addIssue({
        code: 'custom',
        message: 'An exact start time or a flexible time label is required',
        path: ['startTime'],
      });
    }

    if (item.endTime && !item.startTime) {
      context.addIssue({
        code: 'custom',
        message: 'An end time requires an exact start time',
        path: ['endTime'],
      });
    }

    if (item.startTime && item.endTime && item.endTime <= item.startTime) {
      context.addIssue({
        code: 'custom',
        message: 'End time must be later than start time',
        path: ['endTime'],
      });
    }
  });

export const itineraryDayV1Schema = z.object({
  id: itineraryIdSchema,
  dayNumber: z.number().int().positive(),
  date: z.iso.date().optional(),
  title: itineraryTextSchema,
  summary: itineraryTextSchema,
  highlights: z.array(itineraryTextSchema).min(1),
  items: z.array(itineraryItemV1Schema).min(1),
});

export const itineraryV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    destinationTimeZone: itineraryTimeZoneSchema.optional(),
    days: z.array(itineraryDayV1Schema).min(1),
  })
  .superRefine((itinerary, context) => {
    const dayIds = new Set<string>();
    const itemIds = new Set<string>();

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

      day.items.forEach((item, itemIndex) => {
        if (itemIds.has(item.id)) {
          context.addIssue({
            code: 'custom',
            message: 'Item IDs must be unique within an itinerary',
            path: ['days', dayIndex, 'items', itemIndex, 'id'],
          });
        }
        itemIds.add(item.id);
      });
    });
  });

export type ItineraryV1 = z.infer<typeof itineraryV1Schema>;
