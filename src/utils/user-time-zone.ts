import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';

import { tzDate } from '@formkit/tempo';

import type { MaybeDateInput } from '@formkit/tempo';

export const USER_TIME_ZONE_COOKIE = 'bhromon-time-zone';

const DEFAULT_USER_TIME_ZONE = 'UTC';

export function isSupportedTimeZone(timeZone: string) {
  try {
    tzDate(null, timeZone);
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

function getCookieValue(cookieHeader: string, name: string) {
  const prefix = `${name}=`;
  const cookie = cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  return cookie?.slice(prefix.length);
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

export function getUserTimeZoneFromCookie(cookieHeader: string) {
  return decodeTimeZone(getCookieValue(cookieHeader, USER_TIME_ZONE_COOKIE));
}

export function getUserDate(input: MaybeDateInput = null) {
  return tzDate(input, getUserTimeZone());
}
