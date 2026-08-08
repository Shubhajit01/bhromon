import { MapPinIcon } from '@phosphor-icons/react';

import type { ItineraryV1 } from '../schemas/itinerary/v1';

type ItineraryDayData = ItineraryV1['days'][number];
type ItineraryItem = ItineraryDayData['items'][number];

interface ItineraryDayProps {
  day: ItineraryDayData;
}

export function ItineraryDay({ day }: ItineraryDayProps) {
  return (
    <section className="py-10 sm:py-12" aria-labelledby={`day-${day.id}`}>
      <div className="grid gap-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-8">
        <div>
          <p className="text-sm font-medium text-foreground">
            Day {day.dayNumber}
          </p>
          {day.date ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDayDate(day.date)}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <h2
            id={`day-${day.id}`}
            className="text-balance text-xl font-medium tracking-[-0.02em]"
          >
            {day.title}
          </h2>
          <p className="mt-2 max-w-2xl text-pretty leading-7 text-muted-foreground">
            {day.summary}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            <span className="font-medium text-foreground">Highlights:</span>{' '}
            {day.highlights.join(', ')}
          </p>
        </div>
      </div>

      <ol className="mt-8 space-y-7 sm:ml-[9rem]">
        {day.items.map((item) => (
          <ItineraryStop key={item.id} item={item} />
        ))}
      </ol>
    </section>
  );
}

function ItineraryStop({ item }: { item: ItineraryItem }) {
  return (
    <li className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-6">
      <p className="pt-0.5 text-sm font-medium tabular-nums text-muted-foreground">
        {formatItemTime(item)}
      </p>
      <div className="min-w-0 border-l border-border pl-4 sm:pl-6">
        <h3 className="text-base font-medium tracking-tight">{item.title}</h3>
        {item.description ? (
          <p className="mt-1 text-pretty text-sm/6 text-muted-foreground">
            {item.description}
          </p>
        ) : null}
        <p className="mt-2 flex items-start gap-1.5 text-sm/5 text-muted-foreground">
          <MapPinIcon
            aria-hidden="true"
            className="mt-0.5 size-3.5 shrink-0"
            weight="fill"
          />
          <span>
            {item.location.name}
            {item.location.address ? ` · ${item.location.address}` : ''}
          </span>
        </p>
      </div>
    </li>
  );
}

function formatItemTime(item: ItineraryItem) {
  if (!item.startTime) {
    return item.timeLabel;
  }

  if (!item.endTime) {
    return item.startTime;
  }

  return `${item.startTime}–${item.endTime}`;
}

function formatDayDate(date: string) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
