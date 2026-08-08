import { getWeatherTool } from './get-weather';
import { createSaveItineraryTool } from './save-itinerary';

export function createTripAgentTools(tripId: string) {
  return {
    getWeather: getWeatherTool,
    saveItinerary: createSaveItineraryTool({ tripId }),
  };
}
