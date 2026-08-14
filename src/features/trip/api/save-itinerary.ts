import { useMutation } from '@tanstack/react-query';
import { createServerFn, useServerFn } from '@tanstack/react-start';

import { date } from '@formkit/tempo';
import { ulid } from 'ulid';
import { z } from 'zod';

import {
  and,
  db,
  eq,
  itineraryActivity,
  itineraryDay,
  itineraryDayHighlight,
  itineraryRevision,
  or,
  place,
  placeExternalId,
  placeVisit,
  sql,
  trip,
} from '#/db/db.server';
import { getCurrentUser } from '#/features/auth/api/get-current-user';

import { itinerarySaveSchema } from '../schemas/itinerary/save';
import { useInvalidateTrip } from './get-trip';
import { useInvalidateTrips } from './get-trips';

export const saveItineraryInputSchema = z.object({
  tripId: z.string().trim().min(1),
  itinerary: itinerarySaveSchema,
});

export type SaveItineraryInput = z.infer<typeof saveItineraryInputSchema>;

export const saveItinerary = createServerFn({ method: 'POST' })
  .validator(saveItineraryInputSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Authentication required to save itinerary');
    }

    const tripRecord = (
      await db
        .select({ id: trip.id })
        .from(trip)
        .where(and(eq(trip.id, data.tripId), eq(trip.userId, user.id)))
        .limit(1)
    ).at(0);

    if (!tripRecord) {
      throw new Error('Trip not found');
    }

    const revisionId = ulid();
    const confirmedAt = date();
    const nextRevisionNumber = sql<number>`(
      select coalesce(max(${itineraryRevision.revisionNumber}), 0) + 1
      from ${itineraryRevision}
      where ${itineraryRevision.tripId} = ${data.tripId}
    )`;

    const dayRecords: Array<typeof itineraryDay.$inferInsert> = [];
    const highlightRecords: Array<typeof itineraryDayHighlight.$inferInsert> =
      [];
    const visitRecords: Array<typeof placeVisit.$inferInsert> = [];
    const activityRecords: Array<typeof itineraryActivity.$inferInsert> = [];
    const placeRecordsById = new Map<string, typeof place.$inferInsert>();
    const placeExternalIdRecordsById = new Map<
      string,
      typeof placeExternalId.$inferInsert
    >();

    for (const itineraryDayInput of data.itinerary.days) {
      const dayId = ulid();

      dayRecords.push({
        id: dayId,
        revisionId,
        sourceRef: itineraryDayInput.id,
        dayNumber: itineraryDayInput.dayNumber,
        date: itineraryDayInput.date,
        title: itineraryDayInput.title,
        summary: itineraryDayInput.summary,
      });

      itineraryDayInput.highlights.forEach((highlight, highlightIndex) => {
        highlightRecords.push({
          id: ulid(),
          dayId,
          position: highlightIndex + 1,
          text: highlight,
        });
      });

      itineraryDayInput.visits.forEach((visit, visitIndex) => {
        const visitId = ulid();
        const { provider, providerPlaceId } = visit.place;
        const externalIdentity = provider
          ? `${provider}:${providerPlaceId}`
          : undefined;
        const placeId = externalIdentity ? `place:${externalIdentity}` : ulid();

        placeRecordsById.set(placeId, {
          id: placeId,
          name: visit.place.name,
          address: visit.place.address,
          latitude: visit.place.latitude,
          longitude: visit.place.longitude,
          createdAt: confirmedAt,
          updatedAt: confirmedAt,
        });
        if (externalIdentity && provider && providerPlaceId) {
          placeExternalIdRecordsById.set(externalIdentity, {
            id: `place-external:${externalIdentity}`,
            placeId,
            provider,
            externalId: providerPlaceId,
          });
        }
        visitRecords.push({
          id: visitId,
          revisionId,
          dayId,
          placeId,
          sourceRef: visit.id,
          sequence: visitIndex + 1,
        });

        visit.activities.forEach((activity, activityIndex) => {
          activityRecords.push({
            id: ulid(),
            revisionId,
            visitId,
            sourceRef: activity.id,
            position: activityIndex + 1,
            category: activity.category,
            startTime: activity.startTime,
            endTime: activity.endTime,
            timeLabel: activity.timeLabel,
            title: activity.title,
            description: activity.description,
          });
        });
      });
    }

    const placeRecords = [...placeRecordsById.values()];
    const placeExternalIdRecords = [...placeExternalIdRecordsById.values()];

    const [, revisions] = await db.batch([
      db
        .update(itineraryRevision)
        .set({ status: 'superseded' })
        .where(
          and(
            eq(itineraryRevision.tripId, data.tripId),
            or(
              eq(itineraryRevision.status, 'draft'),
              eq(itineraryRevision.status, 'confirmed'),
            ),
          ),
        ),
      db
        .insert(itineraryRevision)
        .values({
          id: revisionId,
          tripId: data.tripId,
          revisionNumber: nextRevisionNumber,
          status: 'confirmed',
          destinationTimeZone: data.itinerary.destinationTimeZone,
          createdAt: confirmedAt,
          confirmedAt,
        })
        .returning({
          id: itineraryRevision.id,
          revisionNumber: itineraryRevision.revisionNumber,
          status: itineraryRevision.status,
          createdAt: itineraryRevision.createdAt,
        }),
      db
        .insert(place)
        .values(placeRecords)
        .onConflictDoUpdate({
          target: place.id,
          set: {
            name: sql`excluded.name`,
            address: sql`excluded.address`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
            updatedAt: confirmedAt,
          },
        }),
      ...(placeExternalIdRecords.length > 0
        ? [
            db
              .insert(placeExternalId)
              .values(placeExternalIdRecords)
              .onConflictDoNothing(),
          ]
        : []),
      db.insert(itineraryDay).values(dayRecords),
      db.insert(itineraryDayHighlight).values(highlightRecords),
      db.insert(placeVisit).values(visitRecords),
      db.insert(itineraryActivity).values(activityRecords),
      db
        .update(trip)
        .set({ status: 'confirmed', updatedAt: confirmedAt })
        .where(eq(trip.id, data.tripId)),
    ]);

    const revision = revisions.at(0);

    if (!revision) {
      throw new Error('Itinerary revision was not saved');
    }

    return revision;
  });

export function useSaveItinerary() {
  const saveItineraryServerFn = useServerFn(saveItinerary);
  const invalidateTrip = useInvalidateTrip();
  const invalidateTrips = useInvalidateTrips();

  return useMutation({
    mutationFn: (data: SaveItineraryInput) => saveItineraryServerFn({ data }),
    onSuccess: (_, input) => {
      void invalidateTrip({ tripId: input.tripId });
      void invalidateTrips();
    },
  });
}
