import { memo } from 'react';

import { Bubble, BubbleContent } from '#/components/ui/bubble';
import {
  Message,
  MessageContent,
  MessageFooter,
} from '#/components/ui/message';
import { site } from '#/config/site';

import type { SaveItineraryInput } from '#/features/trip/api/save-itinerary';

import { TripChatMessagePart } from './trip-chat-message-part';

import type { TripChatMessage as TripChatMessageType } from '../types/trip-chat-message';
import type { TripChatToolApprovalResponse } from './save-itinerary-approval';

interface TripChatMessageProps {
  message: TripChatMessageType;
  isStreaming: boolean;
  isExistingItinerary: boolean;
  isRetryingSave: boolean;
  onToolApproval: (response: TripChatToolApprovalResponse) => void;
  onRetrySave: (itinerary: SaveItineraryInput['itinerary']) => void;
  onKeepRefining: () => void;
}

export const TripChatMessage = memo(function TripChatMessage({
  message,
  isStreaming,
  isExistingItinerary,
  isRetryingSave,
  onToolApproval,
  onRetrySave,
  onKeepRefining,
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
          <BubbleContent
            className={
              isUser
                ? undefined
                : 'flex flex-col gap-1.5 *:data-[part-type=text]:not-first:mt-2'
            }
          >
            {message.parts.map((part, partIndex) => (
              <TripChatMessagePart
                key={`${message.id}:${part.type}:${partIndex}`}
                messageId={message.id}
                part={part}
                partIndex={partIndex}
                isStreaming={isStreaming}
                isUser={isUser}
                metadata={message.metadata}
                onToolApproval={onToolApproval}
                onRetrySave={onRetrySave}
                onKeepRefining={onKeepRefining}
                isExistingItinerary={isExistingItinerary}
                isRetryingSave={isRetryingSave}
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
            . Forecast summary adapted by {site.name}.
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
});
