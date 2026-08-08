import { tzDate } from '@formkit/tempo';

import type { Trip } from '../api/get-trip';

export type ItineraryRevision = Trip['itineraryRevisions'][number];

const itineraryDateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

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

  return itineraryDateFormatter.formatRange(
    tzDate(completeDates[0], 'UTC'),
    tzDate(completeDates[completeDates.length - 1], 'UTC'),
  );
}
