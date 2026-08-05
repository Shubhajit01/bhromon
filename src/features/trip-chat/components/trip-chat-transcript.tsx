import type { UIMessage } from 'ai';

import { MessageGroup } from '#/components/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from '#/components/ui/message-scroller';

import { groupTripChatMessages } from '../utils/group-trip-chat-messages';
import { TripChatMessage } from './trip-chat-message';

interface TripChatTranscriptProps {
  messages: UIMessage[];
  isStreaming: boolean;
}

export function TripChatTranscript({
  messages,
  isStreaming,
}: TripChatTranscriptProps) {
  const groups = groupTripChatMessages(messages);
  const activeMessageId = isStreaming
    ? getLatestAssistantMessageId(messages)
    : undefined;

  return (
    <div className="relative min-h-0 grow isolate">
      <MessageScroller className="absolute inset-0">
        <MessageScrollerViewport
          role="log"
          aria-label="Trip planning conversation"
          aria-relevant="additions"
        >
          <MessageScrollerContent className="box">
            {groups.length ? (
              groups.map((group) => (
                <MessageScrollerItem key={group.id}>
                  <MessageGroup data-role={group.role}>
                    {group.messages.map((message) => (
                      <TripChatMessage
                        key={message.id}
                        message={message}
                        isStreaming={message.id === activeMessageId}
                      />
                    ))}
                  </MessageGroup>
                </MessageScrollerItem>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Your trip conversation will appear here.
              </p>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton size="icon-lg" className="size-11" />
      </MessageScroller>
    </div>
  );
}

function getLatestAssistantMessageId(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === 'assistant' && message.parts.length) {
      return message.id;
    }
  }

  return undefined;
}
