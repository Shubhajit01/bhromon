import { CaretDownIcon } from '@phosphor-icons/react';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from '#/components/ui/card';
import { Collapsible, CollapsibleContent } from '#/components/ui/collapsible';
import { Separator } from '#/components/ui/separator';

import type { ItineraryV1 } from '../schemas/itinerary/v1';

type ItineraryDayData = ItineraryV1['days'][number];
type ItineraryItem = ItineraryDayData['items'][number];

interface ItineraryDayProps {
  day: ItineraryDayData;
}

export function ItineraryDay({ day }: ItineraryDayProps) {
  const date = day.date ? (
    <span className="text-muted-foreground">{formatDayDate(day.date)}</span>
  ) : null;

  return (
    <Card size="sm" className="pb-0">
      <CardHeader className="gap-px">
        <div className="flex md:items-center justify-between flex-col md:flex-row">
          <h2 className="text-lg font-medium">
            <span className="text-primary text-sm md:text-lg">
              Day {day.dayNumber}
              <span className="md:hidden">&nbsp;{date}</span>
            </span>
            <span className="hidden md:inline">&nbsp;&nbsp;</span>
            <br className="md:hidden" />
            {day.title}
          </h2>
          <p className="hidden md:block text-sm">{date}</p>
        </div>

        <CardDescription>{day.summary}</CardDescription>

        <ul className="flex flex-wrap gap-x-1 gap-y-1 mt-2">
          {day.highlights.map((h) => (
            <li key={h}>
              <Badge variant="outline">{h}</Badge>
            </li>
          ))}
        </ul>
      </CardHeader>

      <CardFooter className="items-stretch">
        <Collapsible className="-mx-(--card-spacing) w-[calc(100%+2*var(--card-spacing))]">
          <Button
            size="sm"
            slot="trigger"
            variant="secondary"
            className="w-full px-4 justify-between font-medium rounded-none aria-[expanded=false]:rounded-b-xl border-none aria-[expanded=false]:rounded-t-0!"
          >
            <div className="grow text-left">
              <span className="group-aria-expanded/button:inline hidden">
                Hide Itinerary
              </span>
              <span className="group-aria-expanded/button:hidden">
                Show Itinerary
              </span>
            </div>
            <CaretDownIcon
              weight="bold"
              className="group-aria-expanded/button:-rotate-180 transition-transform"
            />
          </Button>
          <CollapsibleContent>
            <ol>
              {day.items.map((item) => (
                <ItineraryStop key={item.id} item={item} />
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  );
}

function ItineraryStop({ item }: { item: ItineraryItem }) {
  return (
    <li className="flex gap-4 items-start not-last:border-b border-foreground/5 px-4">
      <p className="pt-4 text-sm font-medium tabular-nums text-muted-foreground w-22 shrink-0">
        {formatItemTime(item)}
      </p>
      <Separator orientation="vertical" className="bg-foreground/5" />
      <div className="min-w-0 py-3">
        <h3 className="text-base font-medium tracking-tight">{item.title}</h3>
        {item.description ? (
          <p className="text-pretty text-sm/6 text-muted-foreground -mt-0.5">
            {item.description}
          </p>
        ) : null}
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
