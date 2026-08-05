import type { ChatStatus } from 'ai';

import { MessageScrollerProvider } from '#/components/ui/message-scroller';

import { useTripChat } from '../hooks/use-trip-chat';
import { TRIP_CHAT_ACTIVITY } from '../types/trip-chat-activity';
import { TripChatComposer } from './trip-chat-composer';
import { TripChatFeedback } from './trip-chat-feedback';
import { TripChatTranscript } from './trip-chat-transcript';

import type { TripChatActivity } from '../types/trip-chat-activity';

interface TripChatProps {
  tripId: string;
}

export function TripChat({ tripId }: TripChatProps) {
  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate,
    clearError,
    error,
    isStreaming,
    isRecovering,
    connectionError,
  } = useTripChat({ tripId });

  const activity = getTripChatActivity({
    connectionError,
    error,
    isRecovering,
    isStreaming,
    status,
  });

  const handleSend = (prompt: string) => {
    clearError();
    void sendMessage({ text: prompt });
  };

  const handleRetry = () => {
    clearError();
    void regenerate();
  };

  const composerMode = getComposerMode(activity, handleSend, stop);

  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="start">
      <div className="flex h-full min-h-0 flex-col gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <TripChatTranscript
          messages={messages}
          isStreaming={activity === TRIP_CHAT_ACTIVITY.STREAMING}
        />

        <div className="box flex shrink-0 flex-col gap-2">
          <TripChatFeedback activity={activity} onRetry={handleRetry} />
          <TripChatComposer {...composerMode} />
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

function getTripChatActivity({
  connectionError,
  error,
  isRecovering,
  isStreaming,
  status,
}: {
  connectionError: unknown;
  error: unknown;
  isRecovering: boolean;
  isStreaming: boolean;
  status: ChatStatus;
}): TripChatActivity {
  if (connectionError) {
    return TRIP_CHAT_ACTIVITY.RECONNECTING;
  }

  if (status === 'error' || error) {
    return TRIP_CHAT_ACTIVITY.ERROR;
  }

  if (isRecovering) {
    return TRIP_CHAT_ACTIVITY.RECOVERING;
  }

  if (status === 'submitted') {
    return TRIP_CHAT_ACTIVITY.SUBMITTING;
  }

  if (status === 'streaming' || isStreaming) {
    return TRIP_CHAT_ACTIVITY.STREAMING;
  }

  return TRIP_CHAT_ACTIVITY.READY;
}

function getComposerMode(
  activity: TripChatActivity,
  onSend: (prompt: string) => void,
  onStop: () => void,
) {
  if (
    activity === TRIP_CHAT_ACTIVITY.SUBMITTING ||
    activity === TRIP_CHAT_ACTIVITY.STREAMING ||
    activity === TRIP_CHAT_ACTIVITY.RECOVERING
  ) {
    return { mode: 'stop' as const, onStop };
  }

  if (activity === TRIP_CHAT_ACTIVITY.RECONNECTING) {
    return { mode: 'unavailable' as const };
  }

  return { mode: 'compose' as const, onSend };
}
