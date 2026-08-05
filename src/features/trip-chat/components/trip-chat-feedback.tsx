import { Button } from '#/components/ui/button';

import { TRIP_CHAT_ACTIVITY } from '../types/trip-chat-activity';

import type { TripChatActivity } from '../types/trip-chat-activity';

interface TripChatFeedbackProps {
  activity: TripChatActivity;
  onRetry: () => void;
}

const announcements: Record<TripChatActivity, string> = {
  [TRIP_CHAT_ACTIVITY.READY]: '',
  [TRIP_CHAT_ACTIVITY.SUBMITTING]: 'Bhromon is thinking about your reply.',
  [TRIP_CHAT_ACTIVITY.STREAMING]: 'Bhromon is updating your trip.',
  [TRIP_CHAT_ACTIVITY.RECOVERING]:
    'Bhromon is recovering the interrupted reply.',
  [TRIP_CHAT_ACTIVITY.RECONNECTING]:
    'The connection was interrupted. Reconnecting.',
  [TRIP_CHAT_ACTIVITY.ERROR]: 'Bhromon could not finish that reply.',
};

export function TripChatFeedback({ activity, onRetry }: TripChatFeedbackProps) {
  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements[activity]}
      </p>

      {activity === TRIP_CHAT_ACTIVITY.ERROR ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 text-sm text-destructive"
        >
          <span>Bhromon lost the thread for a moment.</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="min-h-11"
            onPress={onRetry}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {activity === TRIP_CHAT_ACTIVITY.RECOVERING ? (
        <p className="text-sm text-muted-foreground">
          Recovering the interrupted reply…
        </p>
      ) : null}

      {activity === TRIP_CHAT_ACTIVITY.RECONNECTING ? (
        <p className="text-sm text-muted-foreground">Reconnecting…</p>
      ) : null}
    </>
  );
}
