import { z } from 'zod';

import { getUserTimeZone, isSupportedTimeZone } from '#/utils/user-time-zone';

export interface UserTimeContext {
  currentDateTime: string;
  timeZone: string;
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
    timeZone: getUserTimeZone(),
  };
}
