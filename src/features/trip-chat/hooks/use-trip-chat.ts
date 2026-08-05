import { useAgentChat } from 'agents/chat/react';
import { useAgent } from 'agents/react';

import { useTripMessages } from '../api/get-trip-messages';

interface UseTripChatOptions {
  tripId: string;
}

export function useTripChat({ tripId }: UseTripChatOptions) {
  const initialMessages = useTripMessages({ tripId });
  const agent = useAgent({ name: tripId, agent: 'TripAgent' });

  return useAgentChat({
    agent,
    messages: initialMessages,
    getInitialMessages: null,
  });
}
