export const TRIP_CHAT_ACTIVITY = {
  READY: 'ready',
  SUBMITTING: 'submitting',
  STREAMING: 'streaming',
  RECOVERING: 'recovering',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

export type TripChatActivity =
  (typeof TRIP_CHAT_ACTIVITY)[keyof typeof TRIP_CHAT_ACTIVITY];
