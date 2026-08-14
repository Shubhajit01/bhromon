import { date } from '@formkit/tempo';

import { db, place, placeExternalId, sql } from '#/db/db.server';

import type { PlaceSearchCandidate } from '../providers/geoapify';

export interface GroundedPlace extends PlaceSearchCandidate {
  placeId: string;
}

function getPlaceId(candidate: PlaceSearchCandidate) {
  return `place:${candidate.provider}:${candidate.providerPlaceId}`;
}

export async function groundPlaces(
  candidates: Array<PlaceSearchCandidate>,
): Promise<Array<GroundedPlace>> {
  if (candidates.length === 0) {
    return [];
  }

  const updatedAt = date();
  const groundedPlaces = candidates.map((candidate) => ({
    ...candidate,
    placeId: getPlaceId(candidate),
  }));

  await db.batch([
    db
      .insert(place)
      .values(
        groundedPlaces.map((candidate) => ({
          id: candidate.placeId,
          name: candidate.name,
          address: candidate.address,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          createdAt: updatedAt,
          updatedAt,
        })),
      )
      .onConflictDoUpdate({
        target: place.id,
        set: {
          name: sql`excluded.name`,
          address: sql`excluded.address`,
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
          updatedAt,
        },
      }),
    db
      .insert(placeExternalId)
      .values(
        groundedPlaces.map((candidate) => ({
          id: `place-external:${candidate.provider}:${candidate.providerPlaceId}`,
          placeId: candidate.placeId,
          provider: candidate.provider,
          externalId: candidate.providerPlaceId,
        })),
      )
      .onConflictDoNothing(),
  ]);

  return groundedPlaces;
}
