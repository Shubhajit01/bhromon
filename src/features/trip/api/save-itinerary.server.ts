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
import { createLogger, elapsedMilliseconds } from '#/lib/logger';

import { routeWithGeoapify } from '../providers/geoapify-routing.server';

import type { SaveItineraryInput } from './save-itinerary-input';

const logger = createLogger('itinerary-save');

export class UnresolvedItineraryPlacesError extends Error {
  constructor(readonly placeIds: number[]) {
    super(`Itinerary contains unresolved places: ${placeIds.join(', ')}`);
    this.name = 'UnresolvedItineraryPlacesError';
  }
}

export async function saveItineraryImplementation(data: SaveItineraryInput) {
  const startedAt = performance.now();
  logger.info('itinerary_save.started', {
    dayCount: data.itinerary.days.length,
    tripId: data.tripId,
    visitCount: data.itinerary.days.reduce(
      (count, day) => count + day.visits.length,
      0,
    ),
  });
  const user = await getCurrentUser();

  if (!user) {
    logger.warn('itinerary_save.authentication_required', {
      tripId: data.tripId,
    });
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
    logger.warn('itinerary_save.trip_not_found', { tripId: data.tripId });
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
    logger.warn('itinerary_save.places_unresolved', {
      tripId: data.tripId,
      unresolvedPlaceCount: ungroundedPlaceIds.length,
    });
    throw new UnresolvedItineraryPlacesError(ungroundedPlaceIds);
  }

  const revisionId = ulid();
  const confirmedAt = date();
  const nextRevisionNumber = sql<number>`(
      select coalesce(max(${itineraryRevision.revisionNumber}), 0) + 1
      from ${itineraryRevision}
      where ${itineraryRevision.tripId} = ${data.tripId}
    )`;

  const dayRecords: Array<typeof itineraryDay.$inferInsert> = [];
  const highlightRecords: Array<typeof itineraryDayHighlight.$inferInsert> = [];
  const visitRecords: Array<typeof placeVisit.$inferInsert> = [];
  const activityRecords: Array<typeof itineraryActivity.$inferInsert> = [];
  const transitionRecords: Array<typeof itineraryTransition.$inferInsert> = [];
  const routingDays: Array<{
    mode: (typeof data.itinerary.days)[number]['travelMode'];
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
          primaryMode: itineraryDayInput.travelMode,
        };
      });

    transitionRecords.push(...dayTransitionRecords);

    if (dayTransitionRecords.length > 0) {
      routingDays.push({
        mode: itineraryDayInput.travelMode,
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
    logger.error(
      'itinerary_save.revision_missing',
      new Error('Itinerary revision was not saved'),
      { tripId: data.tripId },
    );
    throw new Error('Itinerary revision was not saved');
  }

  logger.info('itinerary_save.revision_persisted', {
    activityCount: activityRecords.length,
    dayCount: dayRecords.length,
    revisionId: revision.id,
    transitionCount: transitionRecords.length,
    tripId: data.tripId,
    visitCount: visitRecords.length,
  });

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
        mode: routingDay.mode,
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
      logger.error('itinerary_save.routing_failed', error, {
        transitionCount: routingDay.transitions.length,
        tripId: data.tripId,
      });

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

  logger.info('itinerary_save.completed', {
    durationMs: elapsedMilliseconds(startedAt),
    revisionId: revision.id,
    routingDayCount: routingDays.length,
    tripId: data.tripId,
  });
  return revision;
}
