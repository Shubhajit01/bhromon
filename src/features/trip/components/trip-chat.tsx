import { Streamdown } from 'streamdown';

import type { UIMessage } from 'ai';

import { Bubble, BubbleContent } from '#/components/ui/bubble';
import { Message, MessageContent, MessageGroup } from '#/components/ui/message';
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '#/components/ui/message-scroller';

import { useTripChat } from '../hooks/use-trip-chat';

interface TripChatProps {
  tripId: string;
}

export function TripChat({ tripId }: TripChatProps) {
  const {
    messages: allMessages,
    sendMessage,
    status,
  } = useTripChat({ tripId });

  const messages = processMessages(allMessages);

  return (
    <MessageScrollerProvider defaultScrollPosition="start">
      <MessageScroller className="h-full">
        <MessageScrollerViewport>
          <MessageScrollerContent>
            {messages.map((group, index) => {
              return (
                <MessageGroup key={index}>
                  {group.map((message) => {
                    const isUser = message.role === 'user';
                    return (
                      <Message
                        key={message.id}
                        align={isUser ? 'end' : 'start'}
                      >
                        <MessageContent>
                          <Bubble variant={isUser ? 'default' : 'ghost'}>
                            <BubbleContent>
                              {message.parts.map((part) => {
                                if (part.type === 'text') {
                                  return isUser ? (
                                    <p key={part.type}>{part.text}</p>
                                  ) : (
                                    <Streamdown
                                      key={part.type}
                                      isAnimating={status === 'streaming'}
                                      className="typeset text-foreground"
                                    >
                                      {part.text}
                                    </Streamdown>
                                  );
                                }
                                return null;
                              })}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    );
                  })}
                </MessageGroup>
              );
            })}
          </MessageScrollerContent>
        </MessageScrollerViewport>
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

function processMessages(messages: UIMessage[]) {
  const final: UIMessage[][] = [];
  const group: UIMessage[] = [];
  for (const message of messages) {
    if (!message.parts.length) {
      continue;
    }
    const last = group.at(-1);
    if (!last || last.role === message.role) {
      group.push(message);
    } else {
      final.push([...group]);
      group.length = 0;
      group.push(message);
    }
  }
  if (group.length) {
    final.push(group);
  }
  return final;
}
