import { startTransition, useEffect, useState } from 'react';

import { date, diff, format } from '@formkit/tempo';

interface ElapsedTimeProps {
  startTime: string | number;
  endTime?: string | number;
}

const elapsedTimeFormatter = new Intl.DurationFormat('en', { style: 'long' });

export function ElapsedTime({ startTime, endTime }: ElapsedTimeProps) {
  const [now, setNow] = useState(() => endTime ?? getCurrentDateTime());

  useEffect(() => {
    if (endTime !== undefined) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => setNow(getCurrentDateTime()));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [endTime]);

  return formatElapsedTime(startTime, endTime ?? now);
}

function formatElapsedTime(
  startTime: string | number,
  endTime: string | number,
) {
  const duration = diff(toDateInput(startTime), toDateInput(endTime), {
    abs: true,
    skip: ['years', 'months', 'weeks', 'days', 'milliseconds'],
  });

  return elapsedTimeFormatter.format(
    Object.keys(duration).length ? duration : { seconds: 1 },
  );
}

function getCurrentDateTime() {
  return format(date(), 'ISO8601');
}

function toDateInput(value: string | number) {
  if (typeof value === 'string') {
    return value;
  }

  const legacyDate = date();
  legacyDate.setTime(value);
  return legacyDate;
}
