import { decode } from '@googlemaps/polyline-codec';

import type { Feature, FeatureCollection, LineString } from 'geojson';

import type { ItineraryRevision } from '../schemas/itinerary/read';

const ITINERARY_DAY_COLORS = ['#432dd7', '#4f6fb1', '#2f6f6a', '#c08a3a'];

export interface ItineraryMapMarker {
  color: string;
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  name: string;
}

interface ItineraryMapRouteProperties {
  color: string;
  dayNumber: number;
  routeStatus: 'fallback' | 'routed';
}

export interface ItineraryMapProjection {
  bounds: [[number, number], [number, number]] | null;
  markers: Array<ItineraryMapMarker>;
  routes: FeatureCollection<LineString, ItineraryMapRouteProperties>;
}

export function getItineraryDayColor(dayNumber: number) {
  return ITINERARY_DAY_COLORS[(dayNumber - 1) % ITINERARY_DAY_COLORS.length];
}

export function projectItineraryMap(
  revision: ItineraryRevision,
): ItineraryMapProjection {
  const transitionsByVisitPair = new Map(
    revision.transitions.map((transition) => [
      `${transition.originVisitId}:${transition.destinationVisitId}`,
      transition,
    ]),
  );
  const markers: Array<ItineraryMapMarker> = [];
  const routeFeatures: Array<Feature<LineString, ItineraryMapRouteProperties>> =
    [];

  for (const day of revision.days) {
    const color = getItineraryDayColor(day.dayNumber);

    day.visits.forEach((visit) => {
      markers.push({
        id: visit.id,
        label: `${day.dayNumber}.${visit.sequence}`,
        name: visit.place.name,
        latitude: visit.place.latitude,
        longitude: visit.place.longitude,
        color,
      });
    });

    day.visits.slice(0, -1).forEach((originVisit, index) => {
      const destinationVisit = day.visits[index + 1];

      const transition = transitionsByVisitPair.get(
        `${originVisit.id}:${destinationVisit.id}`,
      );
      const decodedRoute = decodeTransitionRoute(transition?.encodedPolyline);
      const isRouted = transition?.status === 'routed' && decodedRoute;
      const coordinates = isRouted
        ? decodedRoute
        : [
            [originVisit.place.longitude, originVisit.place.latitude],
            [destinationVisit.place.longitude, destinationVisit.place.latitude],
          ];

      routeFeatures.push({
        type: 'Feature',
        properties: {
          color,
          dayNumber: day.dayNumber,
          routeStatus: isRouted ? 'routed' : 'fallback',
        },
        geometry: { type: 'LineString', coordinates },
      });
    });
  }

  return {
    markers,
    routes: { type: 'FeatureCollection', features: routeFeatures },
    bounds: getMarkerBounds(markers),
  };
}

function decodeTransitionRoute(encodedPolyline?: string | null) {
  if (!encodedPolyline) {
    return null;
  }

  try {
    const coordinates = decode(encodedPolyline).map(([latitude, longitude]) => [
      longitude,
      latitude,
    ]);

    return coordinates.length >= 2 ? coordinates : null;
  } catch {
    return null;
  }
}

function getMarkerBounds(
  markers: Array<ItineraryMapMarker>,
): ItineraryMapProjection['bounds'] {
  const firstMarker = markers.at(0);

  if (!firstMarker) {
    return null;
  }

  let minLongitude = firstMarker.longitude;
  let maxLongitude = firstMarker.longitude;
  let minLatitude = firstMarker.latitude;
  let maxLatitude = firstMarker.latitude;

  for (const marker of markers.slice(1)) {
    minLongitude = Math.min(minLongitude, marker.longitude);
    maxLongitude = Math.max(maxLongitude, marker.longitude);
    minLatitude = Math.min(minLatitude, marker.latitude);
    maxLatitude = Math.max(maxLatitude, marker.latitude);
  }

  return [
    [minLongitude, minLatitude],
    [maxLongitude, maxLatitude],
  ];
}
