import { useCallback } from 'react';

import { useServerFn } from '@tanstack/react-start';

import { useAgentChat } from 'agents/chat/react';
import { useAgent } from 'agents/react';

import { createLogger } from '#/lib/logger';

import { useTripMessages } from '../api/get-trip-messages';
import { requestInitialTripReply } from '../api/request-initial-trip-reply';

import type { TripChatMessage } from '../types/trip-chat-message';

interface UseTripChatOptions {
  tripId: string;
}

const logger = createLogger('trip-chat-client');

export function useTripChat({ tripId }: UseTripChatOptions) {
  const initialMessages = useTripMessages({ tripId });
  const requestInitialReply = useServerFn(requestInitialTripReply);
  const handleOpen = useCallback(() => {
    if (initialMessages.length !== 1 || initialMessages[0]?.role !== 'user') {
      return;
    }

    void requestInitialReply({ data: { tripId } }).catch((error: unknown) => {
      logger.error('trip_chat.initial_reply_request_failed', error, { tripId });
    });
  }, [initialMessages, requestInitialReply, tripId]);
  const handleClose = useCallback(
    (event: CloseEvent) => {
      if (event.wasClean) return;

      logger.warn('trip_chat.socket.closed_abnormally', {
        closeCode: event.code,
        closeReason: event.reason,
        tripId,
        wasClean: event.wasClean,
      });
    },
    [tripId],
  );
  const handleError = useCallback(
    (error: Event) => {
      logger.error('trip_chat.socket.failed', error, { tripId });
    },
    [tripId],
  );
  const handleConnectionError = useCallback(
    (error: unknown) => {
      logger.error('trip_chat.connection.failed', error, { tripId });
    },
    [tripId],
  );
  const agent = useAgent({
    name: tripId,
    agent: 'TripAgent',
    onClose: handleClose,
    onConnectionError: handleConnectionError,
    onError: handleError,
    onOpen: handleOpen,
  });

  const chat = useAgentChat<unknown, TripChatMessage>({
    agent,
    messages: initialMessages,
    getInitialMessages: null,
  });
  return chat;
}
