import { useState } from 'react';

import { useAutoAnimate } from '@formkit/auto-animate/react';
import { BrainIcon, CaretDownIcon } from '@phosphor-icons/react';
import { Streamdown } from 'streamdown';

import type { ReasoningUIPart } from 'ai';

import { ElapsedTime } from '#/components/elapsed-time';
import { Card, CardContent, CardTitle } from '#/components/ui/card';
import { Marker, MarkerContent, MarkerIcon } from '#/components/ui/marker';
import { cn } from '#/lib/utils';

import type { TripChatMessageMetadata } from '../types/trip-chat-message';

interface TripChatReasoningPartProps {
  messageId: string;
  partIndex: number;
  part: ReasoningUIPart;
  isStreaming: boolean;
  metadata?: TripChatMessageMetadata;
}

export function TripChatReasoningPart({
  messageId,
  partIndex,
  part,
  isStreaming,
  metadata,
}: TripChatReasoningPartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [containerRef] = useAutoAnimate<HTMLDivElement>({
    duration: 200,
    easing: 'ease-out',
  });
  const buttonId = `trip-chat-reasoning-trigger-${messageId}-${partIndex}`;
  const contentId = `trip-chat-reasoning-content-${messageId}-${partIndex}`;
  const isReasoningStreaming = isStreaming && part.state !== 'done';
  const reasoningStartedAt = metadata?.reasoningStartedAt;
  const reasoningEndedAt = metadata?.reasoningEndedAt;

  return (
    <div
      ref={containerRef}
      data-part-type="reasoning"
      className="flex flex-col items-start gap-2"
    >
      <Marker
        id={buttonId}
        render={(props) => <button {...props} type="button" />}
        className={cn(
          'w-auto gap-1 outline-none hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:underline-offset-4',
          isExpanded && 'text-foreground',
        )}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        <MarkerIcon>
          <BrainIcon />
        </MarkerIcon>
        <MarkerContent className={cn(isReasoningStreaming && 'shimmer')}>
          <ReasoningStatus
            isStreaming={isReasoningStreaming}
            startedAt={reasoningStartedAt}
            endedAt={reasoningEndedAt}
          />
        </MarkerContent>
        <MarkerIcon>
          <CaretDownIcon
            className={cn(
              'transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none',
              isExpanded && 'rotate-180',
            )}
          />
        </MarkerIcon>
      </Marker>

      {isExpanded ? (
        <Card
          size="sm"
          id={contentId}
          role="region"
          aria-labelledby={buttonId}
          className="rounded-xl border shadow-none"
        >
          <CardContent>
            <Streamdown
              isAnimating={isReasoningStreaming}
              className="typeset typeset-docs text-sm text-muted-foreground"
            >
              {part.text}
            </Streamdown>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ReasoningStatus({
  isStreaming,
  startedAt,
  endedAt,
}: {
  isStreaming: boolean;
  startedAt?: string | number;
  endedAt?: string | number;
}) {
  const status = isStreaming ? 'Thinking' : 'Thought';
  const hasDuration =
    startedAt !== undefined && (isStreaming || endedAt !== undefined);

  if (!hasDuration) {
    return status;
  }

  return (
    <>
      {status} for{' '}
      <ElapsedTime
        startTime={startedAt}
        endTime={isStreaming ? undefined : endedAt}
      />
    </>
  );
}
