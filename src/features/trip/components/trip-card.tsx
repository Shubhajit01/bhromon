import { ClientOnly, Link } from '@tanstack/react-router';

import { BarricadeIcon, IslandIcon } from '@phosphor-icons/react';
import TimeAgo from 'react-timeago';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '#/components/ui/item';
import { cn } from '#/lib/utils';

import type { TripListItem } from '#/features/trip/api/get-trips';

interface TripCardProps {
  trip: TripListItem;
}

function TripCard({ trip }: TripCardProps) {
  const isConfirmed = trip.status === 'confirmed';

  return (
    <Link
      to="/t/$tripId"
      params={{ tripId: trip.id }}
      className="group/trip block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-primary/20"
    >
      <Item
        role="listitem"
        variant="outline"
        className="rounded-2xl border-border bg-card transition-colors group-hover/trip:bg-muted/50 group-focus-visible/trip:border-primary"
      >
        <ItemMedia>
          {isConfirmed ? <IslandIcon size={20} /> : <BarricadeIcon size={20} />}
        </ItemMedia>
        <ItemContent className="flex items-center gap-2 flex-row">
          <ItemTitle>{trip.title}</ItemTitle>
          <ItemDescription className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                'size-1.5 rounded-full',
                isConfirmed ? 'bg-primary' : 'bg-destructive',
              )}
            />
            {isConfirmed ? 'Confirmed' : 'Draft'}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="ml-auto text-xs text-muted-foreground">
          <ItemDescription className="text-xs">
            <ClientOnly>
              <TimeAgo date={trip.updatedAt} minPeriod={10} />
            </ClientOnly>
          </ItemDescription>
        </ItemActions>
      </Item>
    </Link>
  );
}

export { TripCard };
