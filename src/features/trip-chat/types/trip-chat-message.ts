import type { InferUITools, UIMessage } from 'ai';

import type { createTripAgentTools } from '../agents/trip-agent/tools';

export interface TripChatMessageMetadata {
  reasoningStartedAt?: string | number;
  reasoningEndedAt?: string | number;
  reasoningDurationMs?: number;
}

export type TripChatMessage = UIMessage<
  TripChatMessageMetadata,
  never,
  InferUITools<ReturnType<typeof createTripAgentTools>>
>;
