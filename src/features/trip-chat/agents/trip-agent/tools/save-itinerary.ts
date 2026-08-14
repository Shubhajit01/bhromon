import { interpolatePath, linkOptions } from '@tanstack/react-router';

import { tool } from 'ai';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

import type { UIToolInvocation } from 'ai';

import { itinerarySaveSchema } from '#/features/trip/schemas/itinerary/save';

export const saveItineraryToolInputSchema = z.object({
  itinerary: itinerarySaveSchema.describe(
    'The complete, traveller-confirmed itinerary. Preserve every agreed day, highlight, time, and location.',
  ),
});

interface CreateSaveItineraryToolOptions {
  authHeaders: Headers;
  tripId: string;
}

function getSaveItineraryEndpoint(tripId: string) {
  const options = linkOptions({
    to: '/api/trips/$tripId/itinerary',
    params: { tripId },
  });

  return interpolatePath({
    path: options.to,
    params: options.params,
  }).interpolatedPath;
}

export function createSaveItineraryTool({
  authHeaders,
  tripId,
}: CreateSaveItineraryToolOptions) {
  return tool({
    description:
      'Save the complete itinerary for this trip. Call this only after all material details have been resolved, the final itinerary has been shown to the traveller, and the traveller has explicitly confirmed that it is ready to save. The user must approve the save before it executes.',
    inputSchema: saveItineraryToolInputSchema,
    execute: async ({ itinerary }) => {
      const headers = new Headers(authHeaders);
      headers.set('Content-Type', 'application/json');

      const response = await fetch(
        new URL(getSaveItineraryEndpoint(tripId), env.BETTER_AUTH_URL),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ itinerary }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Itinerary could not be saved (${response.status} ${response.statusText})`,
        );
      }

      return response.json();
    },
  });
}

export type SaveItineraryToolInvocation = UIToolInvocation<
  ReturnType<typeof createSaveItineraryTool>
>;
