import { Bubble, BubbleContent } from '#/components/ui/bubble';
import { Message, MessageContent } from '#/components/ui/message';

import { TripChatMessagePart } from './trip-chat-message-part';

import type { TripChatMessage as TripChatMessageType } from '../types/trip-chat-message';

interface TripChatMessageProps {
  message: TripChatMessageType;
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
                metadata={message.metadata}
              />
            ))}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
