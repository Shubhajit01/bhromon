import type { ReactNode } from 'react';

import { PathIcon } from '@phosphor-icons/react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty';

interface TripItineraryEmptyProps {
  action: ReactNode;
}

export function TripItineraryEmpty({ action }: TripItineraryEmptyProps) {
  return (
    <Empty className="mt-8 min-h-80 border border-border bg-muted/35 px-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PathIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Shape your first day</EmptyTitle>
        <EmptyDescription>
          Tell Bhromon what matters to you. Your day-by-day plan will take shape
          here as you decide together.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{action}</EmptyContent>
    </Empty>
  );
}
