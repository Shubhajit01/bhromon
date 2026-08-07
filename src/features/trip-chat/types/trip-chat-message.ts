import type { UIMessage } from 'ai';

export interface TripChatMessageMetadata {
  reasoningStartedAt?: number;
  reasoningEndedAt?: number;
  reasoningDurationMs?: number;
}

export type TripChatMessage = UIMessage<TripChatMessageMetadata>;
