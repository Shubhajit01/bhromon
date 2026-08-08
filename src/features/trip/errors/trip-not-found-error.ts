export class TripNotFoundError extends Error {
  constructor() {
    super('Trip not found');
    this.name = 'TripNotFoundError';
  }
}
