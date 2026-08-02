import { SuitcaseRollingIcon } from '@phosphor-icons/react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty';
import { ItemGroup } from '#/components/ui/item';
import { useTrips } from '#/features/trip/api/get-trips';
import { TripCard } from '#/features/trip/components/trip-card';

import type { TripStatusFilter } from '#/features/trip/types/trip-status-filter';

interface TripListProps {
  status: TripStatusFilter;
}

function TripList({ status }: TripListProps) {
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
    return (
      <Empty className="border bg-card/55">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SuitcaseRollingIcon weight="duotone" />
          </EmptyMedia>
          <EmptyTitle>No {status} trips yet</EmptyTitle>
          <EmptyDescription>
            Try another filter to see the rest of your trips.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ItemGroup className="gap-2">
      {filteredTrips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </ItemGroup>
  );
}

export { TripList };
