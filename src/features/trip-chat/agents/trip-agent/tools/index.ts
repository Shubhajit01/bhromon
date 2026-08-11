import { getWeatherTool } from './get-weather';
import { createSaveItineraryTool } from './save-itinerary';
import { startNewTripTool } from './start-new-trip';

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
    startNewTrip: startNewTripTool,
  };
}
