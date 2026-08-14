import { getWeatherTool } from './get-weather';
import { createSaveItineraryTool } from './save-itinerary';
import { searchPlacesTool } from './search-places';

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
    searchPlaces: searchPlacesTool,
    saveItinerary: createSaveItineraryTool({ authHeaders, tripId }),
  };
}
