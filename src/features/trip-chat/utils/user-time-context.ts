import { z } from 'zod';

export interface UserTimeContext {
  currentDateTime: string;
  timeZone: string;
}

function isSupportedTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const userTimeContextSchema: z.ZodType<UserTimeContext> = z.object({
  currentDateTime: z.iso.datetime({ offset: true }),
  timeZone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(isSupportedTimeZone, 'Unsupported time zone'),
});

export function getUserTimeContext(): UserTimeContext {
  return {
    currentDateTime: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
