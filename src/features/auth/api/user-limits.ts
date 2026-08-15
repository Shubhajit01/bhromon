export interface SavedTripLimit {
  canCreate: boolean;
  limit: number;
  remaining: number;
}

export interface UserLimits {
  savedTrips: SavedTripLimit | null;
}
