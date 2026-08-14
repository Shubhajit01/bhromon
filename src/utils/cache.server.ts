export interface FetchAsJsonOptions {
  cacheKey?: string;
  cacheTtlSeconds: number;
  signal?: AbortSignal;
}

export async function fetchAsJson<T>(
  url: string | URL,
  { cacheKey, cacheTtlSeconds, signal }: FetchAsJsonOptions,
): Promise<T | null> {
  const response = await fetch(url, {
    signal,
    cf: {
      ...(cacheKey ? { cacheKey } : {}),
      cacheTtlByStatus: {
        '200-299': cacheTtlSeconds,
        '400-599': -1,
      },
    },
  });

  return response.ok ? await response.json<T>() : null;
}
