import { getWeatherTool } from './get-weather';
import { createPlanDailyRoutesTool } from './plan-daily-routes';
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
    planDailyRoutes: createPlanDailyRoutesTool({ tripId }),
    searchPlaces: searchPlacesTool,
    saveItinerary: createSaveItineraryTool({ authHeaders, tripId }),
  };
}
