import { format } from '@formkit/tempo';

import { getUserDate, getUserTimeZone } from '#/utils/user-time-zone';

import type { Trip } from '../api/get-trip';

export type ItineraryRevision = Trip['itineraryRevisions'][number];

export function getCurrentItineraryRevision(
  revisions: Array<ItineraryRevision>,
) {
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

export function formatItineraryDateRange(dates: Array<string | undefined>) {
  const completeDates = dates.filter((date): date is string => Boolean(date));

  if (completeDates.length !== dates.length || completeDates.length === 0) {
    return undefined;
  }

  const timeZone = getUserTimeZone();
  const startDate = formatCalendarDate(completeDates[0], timeZone);
  const endDate = formatCalendarDate(
    completeDates[completeDates.length - 1],
    timeZone,
  );

  return startDate === endDate ? startDate : `${startDate} – ${endDate}`;
}

function formatCalendarDate(value: string, timeZone: string) {
  return format({
    date: getUserDate(value),
    format: 'long',
    locale: 'en-GB',
    tz: timeZone,
  });
}
