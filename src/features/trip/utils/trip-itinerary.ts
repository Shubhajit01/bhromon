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
  const start = completeDates[0];
  const end = completeDates[completeDates.length - 1];

  if (start === end) {
    return formatCalendarDate(start, timeZone, 'D MMM YYYY');
  }

  const isSameYear = start.slice(0, 4) === end.slice(0, 4);
  const startDate = formatCalendarDate(
    start,
    timeZone,
    isSameYear ? 'D MMM' : 'D MMM YYYY',
  );
  const endDate = formatCalendarDate(end, timeZone, 'D MMM YYYY');

  return `${startDate} - ${endDate}`;
}

function formatCalendarDate(
  value: string,
  timeZone: string,
  dateFormat: string,
) {
  return format({
    date: getUserDate(value),
    format: dateFormat,
    locale: 'en-GB',
    tz: timeZone,
  });
}
