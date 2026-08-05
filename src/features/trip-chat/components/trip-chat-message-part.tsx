import { Streamdown } from 'streamdown';

import type { UIMessage } from 'ai';

interface TripChatMessagePartProps {
  messageId: string;
  part: UIMessage['parts'][number];
  partIndex: number;
  isStreaming: boolean;
  isUser: boolean;
}

export function TripChatMessagePart({
  messageId: _messageId,
  part,
  partIndex: _partIndex,
  isStreaming,
  isUser,
}: TripChatMessagePartProps) {
  if (part.type !== 'text') {
    return null;
  }

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
