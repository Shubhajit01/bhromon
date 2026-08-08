import type { ReactNode } from 'react';

import { CalendarBlankIcon } from '@phosphor-icons/react';

import { ItineraryDay } from './itinerary-day';
import { TripItineraryEmpty } from './trip-itinerary-empty';

import type { useTrip } from '../api/get-trip';

type Trip = NonNullable<ReturnType<typeof useTrip>>;
type ItineraryRevision = Trip['itineraryRevisions'][number];

interface TripOverviewProps {
  trip: Trip;
  chatAction: ReactNode;
}

export function TripOverview({ trip, chatAction }: TripOverviewProps) {
  const revision = getCurrentRevision(trip.itineraryRevisions);

  if (!revision) {
    return (
      <>
        <TripOverviewHeader trip={trip} />
        <TripItineraryEmpty action={chatAction} />
      </>
    );
  }

  const { days } = revision.content;
  const dateRange = formatDateRange(days.map((day) => day.date));
  const isConfirmed = revision.status === 'confirmed';

  return (
    <article>
      <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <TripStatus isConfirmed={isConfirmed} />
          <h1 className="mt-3 text-balance text-3xl font-normal tracking-[-0.025em] text-foreground">
            {trip.title}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <CalendarBlankIcon aria-hidden="true" className="size-4" />
            <span>{days.length === 1 ? '1 day' : `${days.length} days`}</span>
            {dateRange ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{dateRange}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 self-start sm:self-auto">{chatAction}</div>
      </header>

      <div className="divide-y divide-border">
        {days.map((day) => (
          <ItineraryDay key={day.id} day={day} />
        ))}
      </div>
    </article>
  );
}

function TripOverviewHeader({ trip }: { trip: Trip }) {
  return (
    <header className="border-b border-border pb-8">
      <TripStatus isConfirmed={trip.status === 'confirmed'} />
      <h1 className="mt-3 text-balance text-3xl font-normal tracking-[-0.025em] text-foreground">
        {trip.title}
      </h1>
      <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
        Your itinerary will appear here once you shape it together in chat.
      </p>
    </header>
  );
}

function TripStatus({ isConfirmed }: { isConfirmed: boolean }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <span
        aria-hidden="true"
        className={
          isConfirmed
            ? 'size-1.5 rounded-full bg-primary'
            : 'size-1.5 rounded-full bg-destructive'
        }
      />
      {isConfirmed ? 'Confirmed itinerary' : 'Draft itinerary'}
    </p>
  );
}

function getCurrentRevision(revisions: Array<ItineraryRevision>) {
  return revisions.reduce<ItineraryRevision | undefined>(
    (current, revision) => {
      const isCurrent =
        revision.status === 'draft' || revision.status === 'confirmed';

      if (!isCurrent) {
        return current;
      }

      if (!current || revision.revisionNumber > current.revisionNumber) {
        return revision;
      }

      return current;
    },
    undefined,
  );
}

function formatDateRange(dates: Array<string | undefined>) {
  const completeDates = dates.filter((date): date is string => Boolean(date));

  if (completeDates.length !== dates.length || completeDates.length === 0) {
    return undefined;
  }

  const start = parseItineraryDate(completeDates[0]);
  const end = parseItineraryDate(completeDates.at(-1)!);
  const fullDate = new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  if (start.getUTCFullYear() === end.getUTCFullYear()) {
    if (start.getUTCMonth() === end.getUTCMonth()) {
      const month = new Intl.DateTimeFormat('en', {
        month: 'long',
        timeZone: 'UTC',
      }).format(start);
      const year = start.getUTCFullYear();

      if (start.getUTCDate() === end.getUTCDate()) {
        return `${start.getUTCDate()} ${month} ${year}`;
      }

      return `${start.getUTCDate()}–${end.getUTCDate()} ${month} ${year}`;
    }

    const shortDate = new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });

    return `${shortDate.format(start)} – ${shortDate.format(end)} ${end.getUTCFullYear()}`;
  }

  return `${fullDate.format(start)} – ${fullDate.format(end)}`;
}

function parseItineraryDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}
