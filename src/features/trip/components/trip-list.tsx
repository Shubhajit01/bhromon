import { useAutoAnimate } from '@formkit/auto-animate/react';
import { SuitcaseRollingIcon } from '@phosphor-icons/react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
} from '#/components/ui/item';
import { Skeleton } from '#/components/ui/skeleton';
import { useTrips } from '#/features/trip/api/get-trips';
import { TripCard } from '#/features/trip/components/trip-card';

import type { TripStatusFilter } from '#/features/trip/types/trip-status-filter';

interface TripListProps {
  status: TripStatusFilter;
}

function TripList({ status }: TripListProps) {
  const [parentRef] = useAutoAnimate();

  const trips = useTrips();
  const filteredTrips =
    status === 'all' ? trips : trips.filter((trip) => trip.status === status);

  if (trips.length === 0) {
    return (
      <Empty className="border bg-card/55">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SuitcaseRollingIcon weight="duotone" />
          </EmptyMedia>
          <EmptyTitle>Your next journey starts here</EmptyTitle>
          <EmptyDescription>
            Share a few details in the prompt above and we&apos;ll turn them
            into a trip you can shape together.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (filteredTrips.length === 0) {
    const emptyTitle =
      status === 'confirmed'
        ? 'No saved trips yet'
        : 'No trips to continue planning';

    return (
      <Empty className="border bg-card/55">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SuitcaseRollingIcon weight="duotone" />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>
            Try another filter to see the rest of your trips.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ItemGroup ref={parentRef} className="gap-2">
      {filteredTrips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </ItemGroup>
  );
}

function TripListFallback() {
  return (
    <ItemGroup className="gap-2" aria-label="Loading trips" aria-busy>
      {Array.from({ length: 5 }, (_, index) => (
        <Item
          key={index}
          role="listitem"
          variant="outline"
          className="rounded-2xl border-border bg-card"
        >
          <ItemMedia>
            <Skeleton className="size-5 rounded-full" />
          </ItemMedia>
          <ItemContent className="flex flex-row items-center gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
          </ItemContent>
          <ItemActions className="ml-auto">
            <Skeleton className="h-3 w-14" />
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

export { TripList, TripListFallback };
