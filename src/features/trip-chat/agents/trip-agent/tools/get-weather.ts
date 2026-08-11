import { tool } from 'ai';
import { z } from 'zod';

import { fetchAsJson } from '#/utils/cache.server';

interface LocationResponse {
  results?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }>;
}

interface WeatherResponse {
  daily?: {
    weather_code: Array<number>;
    temperature_2m_min: Array<number>;
    temperature_2m_max: Array<number>;
    precipitation_probability_max: Array<number>;
  };
}

const GEOCODING_CACHE_SECONDS = 60 * 60 * 24 * 30;
const FORECAST_CACHE_SECONDS = 60 * 60;

function getCondition(code: number) {
  if (code === 0) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'foggy';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'rain showers';
  if (code <= 86) return 'snow showers';
  return 'thunderstorms';
}

export const getWeatherTool = tool({
  description:
    'Get the weather forecast for a destination on a specific date. Forecasts are available up to 16 days ahead.',
  inputSchema: z.object({
    location: z.string().describe('City or destination name'),
    date: z.iso.date().describe('Date in YYYY-MM-DD format'),
  }),
  execute: async ({ location, date }, { abortSignal }) => {
    const normalizedLocation = location
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
    const locationQuery = new URLSearchParams({
      name: normalizedLocation,
      count: '1',
    });
    const locationData = await fetchAsJson<LocationResponse>(
      `https://geocoding-api.open-meteo.com/v1/search?${locationQuery}`,
      {
        cacheTtlSeconds: GEOCODING_CACHE_SECONDS,
        signal: abortSignal,
      },
    );
    const place = locationData?.results?.at(0);
    if (!place) return { available: false, reason: 'Location not found' };

    const weatherQuery = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      start_date: date,
      end_date: date,
      timezone: 'auto',
      daily:
        'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max',
    });
    const weather = await fetchAsJson<WeatherResponse>(
      `https://api.open-meteo.com/v1/forecast?${weatherQuery}`,
      {
        cacheTtlSeconds: FORECAST_CACHE_SECONDS,
        signal: abortSignal,
      },
    );
    const weatherCode = weather?.daily?.weather_code.at(0);
    if (weatherCode === undefined) {
      return { available: false, reason: 'Forecast not available yet' };
    }

    return {
      available: true,
      location: `${place.name}, ${place.country}`,
      date,
      condition: getCondition(weatherCode),
      minimumCelsius: weather?.daily?.temperature_2m_min.at(0),
      maximumCelsius: weather?.daily?.temperature_2m_max.at(0),
      rainChancePercent: weather?.daily?.precipitation_probability_max.at(0),
    };
  },
});
