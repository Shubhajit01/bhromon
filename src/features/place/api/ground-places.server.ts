import { date } from '@formkit/tempo';
import { and, eq, inArray } from 'drizzle-orm';

import { db, place, placeExternalId } from '#/db/db.server';

import type { PlaceSearchCandidate } from '../providers/geoapify';

export interface GroundedPlace extends PlaceSearchCandidate {
  placeId: number;
}

export async function groundPlaces(
  candidates: Array<PlaceSearchCandidate>,
): Promise<Array<GroundedPlace>> {
  if (candidates.length === 0) {
    return [];
  }

  const updatedAt = date();
  const externalIds = [
    ...new Set(candidates.map((candidate) => candidate.providerPlaceId)),
  ];
  const existingPlaces = await db
    .select({
      externalId: placeExternalId.externalId,
      placeId: placeExternalId.placeId,
    })
    .from(placeExternalId)
    .where(
      and(
        eq(placeExternalId.provider, 'geoapify'),
        inArray(placeExternalId.externalId, externalIds),
      ),
    );
  const placeIdByExternalId = new Map(
    existingPlaces.map((record) => [record.externalId, record.placeId]),
  );

  const groundedPlaces: Array<GroundedPlace> = [];

  for (const candidate of candidates) {
    const existingPlaceId = placeIdByExternalId.get(
      candidate.providerPlaceId,
    );

    if (existingPlaceId !== undefined) {
      await db
        .update(place)
        .set({
          name: candidate.name,
          address: candidate.address,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          updatedAt,
        })
        .where(eq(place.id, existingPlaceId));
      groundedPlaces.push({ ...candidate, placeId: existingPlaceId });
      continue;
    }

    const insertedPlace = (
      await db
        .insert(place)
        .values({
          name: candidate.name,
          address: candidate.address,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          createdAt: updatedAt,
          updatedAt,
        })
        .returning({ id: place.id })
    ).at(0);

    if (!insertedPlace) {
      throw new Error(`Unable to ground place: ${candidate.name}`);
    }

    await db.insert(placeExternalId).values({
      id: `place-external:${candidate.provider}:${candidate.providerPlaceId}`,
      placeId: insertedPlace.id,
      provider: candidate.provider,
      externalId: candidate.providerPlaceId,
    });
    placeIdByExternalId.set(candidate.providerPlaceId, insertedPlace.id);
    groundedPlaces.push({ ...candidate, placeId: insertedPlace.id });
  }

  return groundedPlaces;
}
