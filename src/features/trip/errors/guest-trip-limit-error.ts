export const GUEST_TRIP_LIMIT_ERROR_CODE = 'GUEST_TRIP_LIMIT_REACHED';

export class GuestTripLimitError extends Error {
  constructor() {
    super(GUEST_TRIP_LIMIT_ERROR_CODE);
    this.name = 'GuestTripLimitError';
  }
}

export function isGuestTripLimitError(error: unknown) {
  return (
    error instanceof GuestTripLimitError ||
    (error instanceof Error && error.message === GUEST_TRIP_LIMIT_ERROR_CODE)
  );
}
