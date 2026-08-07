import { WrenchIcon } from '@phosphor-icons/react';
import { getToolName, isToolUIPart } from 'ai';
import { Streamdown } from 'streamdown';

import { Marker, MarkerContent, MarkerIcon } from '#/components/ui/marker';
import { cn } from '#/lib/utils';

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

  if (isToolUIPart(part) && !isUser) {
    const isToolRunning =
      part.state === 'input-streaming' || part.state === 'input-available';

    return (
      <Marker className="w-auto gap-1">
        <MarkerIcon>
          <WrenchIcon />
        </MarkerIcon>
        <MarkerContent className={cn(isToolRunning && 'shimmer')}>
          {getToolStatus(part.state, formatToolName(getToolName(part)))}
        </MarkerContent>
      </Marker>
    );
  }

  return null;
}

function formatToolName(toolName: string) {
  const words = toolName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

function getToolStatus(state: string, toolName: string) {
  switch (state) {
    case 'input-streaming':
    case 'input-available':
      return `Using ${toolName}`;
    case 'approval-requested':
      return `${toolName} needs approval`;
    case 'approval-responded':
      return `Starting ${toolName}`;
    case 'output-available':
      return `Used ${toolName}`;
    case 'output-error':
      return `${toolName} failed`;
    case 'output-denied':
      return `${toolName} denied`;
    default:
      return toolName;
  }
}
