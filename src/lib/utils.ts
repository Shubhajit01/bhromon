import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function hashify(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const values = Array.from(new Uint16Array(digest));
  return values.map((v) => v.toString(16).padStart(2, '0')).join('');
}
