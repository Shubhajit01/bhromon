import { useMutation } from '@tanstack/react-query';
import { createServerFn, useServerFn } from '@tanstack/react-start';

import { date } from '@formkit/tempo';
import { env } from 'cloudflare:workers';
import { ulid } from 'ulid';
import { z } from 'zod';

import {
  and,
  db,
  eq,
  inArray,
  itineraryActivity,
  itineraryDay,
  itineraryDayHighlight,
  itineraryRevision,
  itineraryTransition,
  or,
  place,
  placeExternalId,
  placeVisit,
  sql,
  trip,
} from '#/db/db.server';
import { getCurrentUser } from '#/features/auth/api/get-current-user';

import { routeWithGeoapify } from '../providers/geoapify-routing.server';
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

    const requestedPlaceIds = [
      ...new Set(
        data.itinerary.days.flatMap((day) =>
          day.visits.map((visit) => visit.placeId),
        ),
      ),
    ];
    const groundedPlaces = await db
      .selectDistinct({
        id: place.id,
        latitude: place.latitude,
        longitude: place.longitude,
      })
      .from(placeExternalId)
      .innerJoin(place, eq(place.id, placeExternalId.placeId))
      .where(inArray(placeExternalId.placeId, requestedPlaceIds));
    const groundedPlacesById = new Map(
      groundedPlaces.map((record) => [record.id, record]),
    );
    const ungroundedPlaceIds = requestedPlaceIds.filter(
      (placeId) => !groundedPlacesById.has(placeId),
    );

    if (ungroundedPlaceIds.length > 0) {
      throw new Error(
        `Itinerary contains unresolved places: ${ungroundedPlaceIds.join(', ')}`,
      );
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
    const transitionRecords: Array<typeof itineraryTransition.$inferInsert> =
      [];
    const routingDays: Array<{
      transitions: Array<typeof itineraryTransition.$inferInsert>;
      waypoints: Array<{ latitude: number; longitude: number }>;
    }> = [];
    let transitionSequence = 1;

    for (const itineraryDayInput of data.itinerary.days) {
      const dayId = ulid();
      const dayVisitRecords: Array<typeof placeVisit.$inferInsert> = [];

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
        visitRecords.push({
          id: visitId,
          revisionId,
          dayId,
          placeId: visit.placeId,
          sourceRef: visit.id,
          sequence: visitIndex + 1,
        });
        dayVisitRecords.push(visitRecords.at(-1)!);

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

      const dayTransitionRecords = dayVisitRecords
        .slice(0, -1)
        .map((originVisit, index) => {
          const destinationVisit = dayVisitRecords[index + 1];

          return {
            id: ulid(),
            revisionId,
            originVisitId: originVisit.id,
            destinationVisitId: destinationVisit.id,
            sequence: transitionSequence++,
            status: 'pending' as const,
            primaryMode: 'drive',
          };
        });

      transitionRecords.push(...dayTransitionRecords);

      if (dayTransitionRecords.length > 0) {
        routingDays.push({
          transitions: dayTransitionRecords,
          waypoints: dayVisitRecords.map((visit) => {
            const groundedPlace = groundedPlacesById.get(visit.placeId);

            if (!groundedPlace) {
              throw new Error(
                `Itinerary contains unresolved place: ${visit.placeId}`,
              );
            }

            return {
              latitude: groundedPlace.latitude,
              longitude: groundedPlace.longitude,
            };
          }),
        });
      }
    }

    const transitionWrite = transitionRecords.length
      ? db.insert(itineraryTransition).values(transitionRecords)
      : db
          .update(trip)
          .set({ updatedAt: confirmedAt })
          .where(eq(trip.id, data.tripId));

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
      db.insert(itineraryDay).values(dayRecords),
      db.insert(itineraryDayHighlight).values(highlightRecords),
      db.insert(placeVisit).values(visitRecords),
      db.insert(itineraryActivity).values(activityRecords),
      transitionWrite,
      db
        .update(trip)
        .set({ status: 'confirmed', updatedAt: confirmedAt })
        .where(eq(trip.id, data.tripId)),
    ]);

    const revision = revisions.at(0);

    if (!revision) {
      throw new Error('Itinerary revision was not saved');
    }

    const geoapifyApiKey = z
      .string()
      .trim()
      .min(1)
      .safeParse(Reflect.get(env, 'GEOAPIFY_API_KEY'));

    for (const routingDay of routingDays) {
      try {
        if (!geoapifyApiKey.success) {
          throw new Error('Geoapify routing is not configured');
        }

        const routedTransitions = await routeWithGeoapify({
          apiKey: geoapifyApiKey.data,
          waypoints: routingDay.waypoints,
        });

        for (const [
          index,
          transitionRecord,
        ] of routingDay.transitions.entries()) {
          const routedTransition = routedTransitions[index];

          await db
            .update(itineraryTransition)
            .set({
              status: 'routed',
              provider: 'geoapify',
              distanceMeters: routedTransition.distanceMeters,
              durationSeconds: routedTransition.durationSeconds,
              encodedPolyline: routedTransition.encodedPolyline,
            })
            .where(eq(itineraryTransition.id, transitionRecord.id));
        }
      } catch (error) {
        console.warn(
          'Itinerary routing failed; straight-line map legs will be used.',
          error instanceof Error ? error.message : error,
        );

        for (const transitionRecord of routingDay.transitions) {
          await db
            .update(itineraryTransition)
            .set({
              status: 'failed',
              provider: null,
              distanceMeters: null,
              durationSeconds: null,
              encodedPolyline: null,
            })
            .where(eq(itineraryTransition.id, transitionRecord.id));
        }
      }
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
