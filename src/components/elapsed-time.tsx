import { startTransition, useEffect, useState } from 'react';

import { diff } from '@formkit/tempo';

interface ElapsedTimeProps {
  startTime: number;
  endTime?: number;
}

const elapsedTimeFormatter = new Intl.DurationFormat('en', { style: 'long' });

export function ElapsedTime({ startTime, endTime }: ElapsedTimeProps) {
  const [now, setNow] = useState(() => endTime ?? Date.now());

  useEffect(() => {
    if (endTime !== undefined) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => setNow(Date.now()));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [endTime]);

  return formatElapsedTime(startTime, endTime ?? now);
}

function formatElapsedTime(startTime: number, endTime: number) {
  const duration = diff(new Date(startTime), new Date(endTime), {
    abs: true,
    skip: ['years', 'months', 'weeks', 'days', 'milliseconds'],
  });

  return elapsedTimeFormatter.format(
    Object.keys(duration).length ? duration : { seconds: 1 },
  );
}
