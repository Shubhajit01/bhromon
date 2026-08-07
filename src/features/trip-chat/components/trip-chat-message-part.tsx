import { Streamdown } from 'streamdown';

import { TripChatReasoningPart } from './trip-chat-reasoning-part';

import type {
  TripChatMessage,
  TripChatMessageMetadata,
} from '../types/trip-chat-message';

interface TripChatMessagePartProps {
  messageId: string;
  part: TripChatMessage['parts'][number];
  partIndex: number;
  isStreaming: boolean;
  isUser: boolean;
  metadata?: TripChatMessageMetadata;
}

export function TripChatMessagePart({
  messageId,
  part,
  partIndex,
  isStreaming,
  isUser,
  metadata,
}: TripChatMessagePartProps) {
  if (part.type === 'reasoning' && !isUser) {
    return (
      <TripChatReasoningPart
        messageId={messageId}
        partIndex={partIndex}
        part={part}
        isStreaming={isStreaming}
        metadata={metadata}
      />
    );
  }

  if (part.type === 'text') {
    if (isUser) {
      return <p>{part.text}</p>;
    }

    return (
      <Streamdown
        isAnimating={isStreaming && part.state !== 'done'}
        className="typeset typeset-docs text-foreground text-sm"
      >
        {part.text}
      </Streamdown>
    );
  }

  return null;
}
