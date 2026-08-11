import { tool } from 'ai';
import { z } from 'zod';

export const startNewTripTool = tool({
  description:
    'Offer the traveller a fresh trip when they replace an already decided destination. Supply a concise, standalone trip brief that they can edit before starting the new conversation. Do not use this for adding, removing, or reordering stops within the same journey.',
  inputSchema: z.object({
    prompt: z.string().trim().min(50).max(4000),
  }),
  execute: async ({ prompt }) => ({ prompt }),
});
