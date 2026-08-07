export interface FetchAsJsonOptions {
  cacheTtlSeconds: number;
  signal?: AbortSignal;
}

export async function fetchAsJson<T>(
  url: string | URL,
  { cacheTtlSeconds, signal }: FetchAsJsonOptions,
): Promise<T | null> {
  const response = await fetch(url, {
    signal,
    cf: {
      cacheTtlByStatus: {
        '200-299': cacheTtlSeconds,
        '400-599': -1,
      },
    },
  });

  return response.ok ? await response.json<T>() : null;
}
