import { useAgentChat } from 'agents/chat/react';
import { useAgent } from 'agents/react';

import { useTripMessages } from '../api/get-trip-messages';

import type { TripChatMessage } from '../types/trip-chat-message';

interface UseTripChatOptions {
  tripId: string;
}

export function useTripChat({ tripId }: UseTripChatOptions) {
  const initialMessages = useTripMessages({ tripId });
  const agent = useAgent({ name: tripId, agent: 'TripAgent' });

  return useAgentChat<unknown, TripChatMessage>({
    agent,
    messages: initialMessages,
    getInitialMessages: null,
  });
}
