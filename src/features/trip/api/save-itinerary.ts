import { useMutation } from '@tanstack/react-query';
import { createServerFn, useServerFn } from '@tanstack/react-start';

import { ulid } from 'ulid';
import { z } from 'zod';

import { and, db, eq, itineraryRevision, or, sql, trip } from '#/db/db.server';
import { getCurrentUser } from '#/features/auth/api/get-current-user';

import { itinerarySchema } from '../schemas/itinerary/schema';
import { useInvalidateTrip } from './get-trip';
import { useInvalidateTrips } from './get-trips';

export const saveItineraryInputSchema = z.object({
  tripId: z.string().trim().min(1),
  itinerary: itinerarySchema,
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
    const confirmedAt = new Date();
    const nextRevisionNumber = sql<number>`(
      select coalesce(max(${itineraryRevision.revisionNumber}), 0) + 1
      from ${itineraryRevision}
      where ${itineraryRevision.tripId} = ${data.tripId}
    )`;

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
          content: data.itinerary,
          confirmedAt,
        })
        .returning({
          id: itineraryRevision.id,
          revisionNumber: itineraryRevision.revisionNumber,
          status: itineraryRevision.status,
          createdAt: itineraryRevision.createdAt,
        }),
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
