import { getWeatherTool } from './get-weather';
import { createSaveItineraryTool } from './save-itinerary';

interface CreateTripAgentToolsOptions {
  authHeaders: Headers;
  tripId: string;
}

export function createTripAgentTools({
  authHeaders,
  tripId,
}: CreateTripAgentToolsOptions) {
  return {
    getWeather: getWeatherTool,
    saveItinerary: createSaveItineraryTool({ authHeaders, tripId }),
  };
}
