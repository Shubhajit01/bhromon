import { Streamdown } from 'streamdown';

import type { UIMessage } from 'ai';

import { TripChatReasoningPart } from './trip-chat-reasoning-part';

interface TripChatMessagePartProps {
  messageId: string;
  part: UIMessage['parts'][number];
  partIndex: number;
  isStreaming: boolean;
  isUser: boolean;
}

export function TripChatMessagePart({
  messageId,
  part,
  partIndex,
  isStreaming,
  isUser,
}: TripChatMessagePartProps) {
  if (part.type === 'reasoning' && !isUser) {
    return (
      <TripChatReasoningPart
        messageId={messageId}
        partIndex={partIndex}
        part={part}
        isStreaming={isStreaming}
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
        className="typeset text-foreground"
      >
        {part.text}
      </Streamdown>
    );
  }

  return null;
}
