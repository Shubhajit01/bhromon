import type { UIMessage } from 'ai';

import { Bubble, BubbleContent } from '#/components/ui/bubble';
import { Message, MessageContent } from '#/components/ui/message';

import { TripChatMessagePart } from './trip-chat-message-part';

interface TripChatMessageProps {
  message: UIMessage;
  isStreaming: boolean;
}

export function TripChatMessage({
  message,
  isStreaming,
}: TripChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <Message align={isUser ? 'end' : 'start'}>
      <MessageContent>
        <Bubble variant={isUser ? 'default' : 'ghost'}>
          <BubbleContent>
            {message.parts.map((part, partIndex) => (
              <TripChatMessagePart
                key={`${message.id}:${part.type}:${partIndex}`}
                messageId={message.id}
                part={part}
                partIndex={partIndex}
                isStreaming={isStreaming}
                isUser={isUser}
              />
            ))}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
