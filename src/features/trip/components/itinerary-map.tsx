import 'maplibre-gl/dist/maplibre-gl.css';

import { useEffect, useMemo, useRef } from 'react';

import { ClientOnly } from '@tanstack/react-router';

import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {
  AttributionControl,
  Layer,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Source,
} from 'react-map-gl/maplibre';

import type { StyleSpecification } from 'maplibre-gl';
import type { LayerProps, MapRef } from 'react-map-gl/maplibre';

import { projectItineraryMap } from '../utils/itinerary-map';

import type { ItineraryRevision } from '../schemas/itinerary/read';
import type { ItineraryMapProjection } from '../utils/itinerary-map';

setWorkerUrl(maplibreWorkerUrl);

interface ItineraryMapProps {
  revision: ItineraryRevision;
  usesGeoapify: boolean;
}

const CARTO_POSITRON_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'carto-positron': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-positron',
      type: 'raster',
      source: 'carto-positron',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

const routeOutlineLayer: LayerProps = {
  id: 'itinerary-route-outline',
  type: 'line',
  paint: {
    'line-color': '#ffffff',
    'line-opacity': 0.9,
    'line-width': 6,
  },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
};

const routedLineLayer: LayerProps = {
  id: 'itinerary-route-routed',
  type: 'line',
  filter: ['==', ['get', 'routeStatus'], 'routed'],
  paint: {
    'line-color': ['get', 'color'],
    'line-opacity': 0.92,
    'line-width': 3,
  },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
};

const fallbackLineLayer: LayerProps = {
  id: 'itinerary-route-fallback',
  type: 'line',
  filter: ['==', ['get', 'routeStatus'], 'fallback'],
  paint: {
    'line-color': ['get', 'color'],
    'line-dasharray': [2, 2],
    'line-opacity': 0.7,
    'line-width': 2.5,
  },
  layout: { 'line-cap': 'round', 'line-join': 'round' },
};

export function ItineraryMap({ revision, usesGeoapify }: ItineraryMapProps) {
  const projection = useMemo(() => projectItineraryMap(revision), [revision]);

  if (projection.markers.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Itinerary map"
      className="overflow-hidden rounded-xl border"
    >
      <ClientOnly fallback={<div className="h-80 bg-muted/35 sm:h-105" />}>
        <ItineraryMapCanvas
          projection={projection}
          usesGeoapify={usesGeoapify}
        />
      </ClientOnly>
    </section>
  );
}

interface ItineraryMapCanvasProps {
  projection: ItineraryMapProjection;
  usesGeoapify: boolean;
}

function ItineraryMapCanvas({
  projection,
  usesGeoapify,
}: ItineraryMapCanvasProps) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !projection.bounds) {
      return;
    }

    map.fitBounds(projection.bounds, {
      animate: false,
      maxZoom: 13,
      padding: 48,
    });
  }, [projection.bounds]);

  return (
    <div className="h-80 bg-muted/35 sm:h-105">
      <MapLibreMap
        ref={mapRef}
        initialViewState={
          projection.bounds
            ? {
                bounds: projection.bounds,
                fitBoundsOptions: { maxZoom: 13, padding: 48 },
              }
            : { latitude: 0, longitude: 0, zoom: 1 }
        }
        mapStyle={CARTO_POSITRON_STYLE}
        attributionControl={false}
        cooperativeGestures
        scrollZoom={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <AttributionControl
          compact
          position="bottom-right"
          customAttribution={
            usesGeoapify
              ? '<a href="https://www.geoapify.com/" target="_blank">Powered by Geoapify</a>'
              : undefined
          }
        />

        <Source id="itinerary-routes" type="geojson" data={projection.routes}>
          <Layer {...routeOutlineLayer} />
          <Layer {...routedLineLayer} />
          <Layer {...fallbackLineLayer} />
        </Source>

        {projection.markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="center"
          >
            <span
              role="img"
              aria-label={`${marker.label}: ${marker.name}`}
              className="grid size-7 place-items-center rounded-full border-2 border-white text-[10px] font-semibold leading-none text-white shadow-sm"
              style={{ backgroundColor: marker.color }}
            >
              {marker.label}
            </span>
          </Marker>
        ))}
      </MapLibreMap>
    </div>
  );
}
