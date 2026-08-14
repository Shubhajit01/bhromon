import { format } from '@formkit/tempo';
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
import { getUserDate, getUserTimeZone } from '#/utils/user-time-zone';

import type {
  ItineraryActivity,
  ItineraryDay as ItineraryDayData,
} from '../schemas/itinerary/read';


interface ItineraryDayProps {
  day: ItineraryDayData;
}

export function ItineraryDay({ day }: ItineraryDayProps) {
  const date = day.date ? (
    <span className="text-muted-foreground">{formatDayDate(day.date)}</span>
  ) : null;

  return (
    <Card
      size="sm"
      className="pb-0 transition-transform has-aria-expanded:scale-101"
    >
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
            className="w-full px-4 justify-between font-medium rounded-none aria-expanded:bg-primary/5 aria-expanded:text-primary transition-colors aria-[expanded=false]:rounded-b-xl border-none aria-[expanded=false]:rounded-t-0!"
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
              {day.visits.flatMap((visit) =>
                visit.activities.map((activity) => (
                  <ItineraryStop key={activity.id} activity={activity} />
                )),
              )}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  );
}

function ItineraryStop({ activity }: { activity: ItineraryActivity }) {
  return (
    <li className="flex gap-4 items-start not-last:border-b border-foreground/5 px-4">
      <p className="pt-4 text-sm font-medium tabular-nums text-muted-foreground w-22 shrink-0">
        {formatActivityTime(activity)}
      </p>
      <Separator orientation="vertical" className="bg-foreground/5" />
      <div className="min-w-0 py-3">
        <h3 className="text-base font-medium tracking-tight">
          {activity.title}
        </h3>
        {activity.description ? (
          <p className="text-balance leading-tight text-sm/6 text-muted-foreground -mt-0.5">
            {activity.description}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function formatActivityTime(activity: ItineraryActivity) {
  if (!activity.startTime) {
    return activity.timeLabel;
  }

  if (!activity.endTime) {
    return activity.startTime;
  }

  return `${activity.startTime}–${activity.endTime}`;
}

function formatDayDate(date: string) {
  const timeZone = getUserTimeZone();

  return format({
    date: getUserDate(date),
    format: 'ddd, MMM D',
    locale: 'en',
    tz: timeZone,
  });
}
