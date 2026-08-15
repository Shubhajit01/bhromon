import { useCallback, useEffect, useRef } from 'react';

import { useAgentChat } from 'agents/chat/react';
import { useAgent } from 'agents/react';

import { createLogger } from '#/lib/logger';

import { useTripMessages } from '../api/get-trip-messages';

import type { TripChatMessage } from '../types/trip-chat-message';

interface UseTripChatOptions {
  tripId: string;
}

const logger = createLogger('trip-chat-client');

export function useTripChat({ tripId }: UseTripChatOptions) {
  const initialMessages = useTripMessages({ tripId });
  const handleOpen = useCallback(() => {
    logger.info('trip_chat.socket.opened', { tripId });
  }, [tripId]);
  const handleClose = useCallback(
    (event: CloseEvent) => {
      logger.info('trip_chat.socket.closed', {
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
  const handleMessage = useCallback(
    (event: MessageEvent) => logTerminalAgentFrame(event, tripId),
    [tripId],
  );

  const agent = useAgent({
    name: tripId,
    agent: 'TripAgent',
    onClose: handleClose,
    onConnectionError: handleConnectionError,
    onError: handleError,
    onMessage: handleMessage,
    onOpen: handleOpen,
  });

  const chat = useAgentChat<unknown, TripChatMessage>({
    agent,
    messages: initialMessages,
    getInitialMessages: null,
  });
  const previousStatus = useRef<string | null>(null);

  useEffect(() => {
    if (previousStatus.current === chat.status) return;

    logger.info('trip_chat.status_changed', {
      connectionError: Boolean(chat.connectionError),
      hasError: Boolean(chat.error),
      isRecovering: chat.isRecovering,
      isStreaming: chat.isStreaming,
      messageCount: chat.messages.length,
      previousStatus: previousStatus.current,
      status: chat.status,
      tripId,
    });
    previousStatus.current = chat.status;
  }, [
    chat.connectionError,
    chat.error,
    chat.isRecovering,
    chat.isStreaming,
    chat.messages.length,
    chat.status,
    tripId,
  ]);

  useEffect(() => {
    if (!chat.error) return;
    logger.error('trip_chat.state_failed', chat.error, {
      messageCount: chat.messages.length,
      status: chat.status,
      tripId,
    });
  }, [chat.error, chat.messages.length, chat.status, tripId]);

  return chat;
}

function logTerminalAgentFrame(event: MessageEvent, tripId: string) {
  if (typeof event.data !== 'string') return;

  try {
    const frame = JSON.parse(event.data) as {
      body?: string;
      done?: boolean;
      error?: boolean;
      id?: string;
      type?: string;
    };
    const isChatChunk = frame.type === 'cf_agent_use_chat_response';

    if (isChatChunk && !frame.done && !frame.error) return;

    logger.info('trip_chat.protocol_frame_received', {
      bodyLength: frame.body?.length ?? 0,
      done: frame.done ?? false,
      frameId: frame.id,
      frameType: frame.type ?? 'unknown',
      hasError: frame.error ?? false,
      tripId,
    });
  } catch {
    logger.warn('trip_chat.protocol_frame_unparseable', {
      bodyLength: event.data.length,
      tripId,
    });
  }
}
