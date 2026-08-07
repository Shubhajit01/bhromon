import { Bubble, BubbleContent } from '#/components/ui/bubble';
import {
  Message,
  MessageContent,
  MessageFooter,
} from '#/components/ui/message';

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
  const hasWeatherResult = message.parts.some(
    (part) =>
      part.type === 'tool-getWeather' && part.state === 'output-available',
  );

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
        {hasWeatherResult && (
          <MessageFooter>
            Weather data by&nbsp;
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-3 hover:text-foreground"
            >
              Open-Meteo.com
            </a>
            &nbsp;
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-3 hover:text-foreground"
            >
              CC BY 4.0
            </a>
            . Forecast summary adapted by Bhromon.
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}
