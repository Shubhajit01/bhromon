import { tool } from 'ai';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

import { groundPlaces } from '#/features/place/api/ground-places.server';
import { searchGeoapifyPlaces } from '#/features/place/providers/geoapify';

const placeQuerySchema = z.string().trim().min(1).max(120);

export const searchPlacesTool = tool({
  description:
    'Resolve specific attractions, restaurants, hotels, stations, and other named places against current place data. Returns canonical internal place IDs required by saveItinerary.',
  inputSchema: z.object({
    destination: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .describe('Destination including city and country when known'),
    queries: z
      .array(placeQuerySchema)
      .min(1)
      .max(5)
      .describe('Specific place names to resolve in the destination'),
  }),
  execute: async ({ destination, queries }, { abortSignal }) => {
    const apiKey = z
      .string()
      .trim()
      .min(1)
      .safeParse(Reflect.get(env, 'GEOAPIFY_API_KEY'));

    if (!apiKey.success) {
      return {
        available: false as const,
        reason: 'Places provider is not configured',
      };
    }

    const searches = [];

    for (const query of queries) {
      const candidates = await searchGeoapifyPlaces({
        apiKey: apiKey.data,
        destination,
        query,
        signal: abortSignal,
      });
      const groundedCandidates = await groundPlaces(candidates);

      searches.push({
        query,
        candidates: groundedCandidates.map((candidate) => ({
          placeId: candidate.placeId,
          name: candidate.name,
          address: candidate.address,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          resultType: candidate.resultType,
          confidence: candidate.confidence,
        })),
      });
    }

    return {
      available: true as const,
      destination,
      searches,
      attribution: {
        provider: 'Geoapify',
        dataSource: 'OpenStreetMap contributors',
      },
    };
  },
});
