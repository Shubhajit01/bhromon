import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

export const USER_TIME_ZONE_COOKIE = 'bhromon-time-zone';

const DEFAULT_USER_TIME_ZONE = 'UTC';

export function isSupportedTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return true;
  } catch {
    return false;
  }
}

function decodeTimeZone(value: string | undefined) {
  if (!value) {
    return DEFAULT_USER_TIME_ZONE;
  }

  try {
    const timeZone = decodeURIComponent(value);
    return isSupportedTimeZone(timeZone) ? timeZone : DEFAULT_USER_TIME_ZONE;
  } catch {
    return DEFAULT_USER_TIME_ZONE;
  }
}

function getBrowserCookie(name: string) {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  return cookie?.slice(prefix.length);
}

export const getUserTimeZone = createIsomorphicFn()
  .server(() => decodeTimeZone(getCookie(USER_TIME_ZONE_COOKIE)))
  .client(() => decodeTimeZone(getBrowserCookie(USER_TIME_ZONE_COOKIE)));
