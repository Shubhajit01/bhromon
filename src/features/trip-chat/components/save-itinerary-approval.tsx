import type { z } from 'zod';

import { Button } from '#/components/ui/button';
import { itinerarySaveSchema } from '#/features/trip/schemas/itinerary/save';

import type { SaveItineraryToolInvocation } from '../agents/trip-agent/tools/save-itinerary';

type ItinerarySaveInput = z.infer<typeof itinerarySaveSchema>;

export interface TripChatToolApprovalResponse {
  approvalId: string;
  approved: boolean;
  toolCallId: string;
}

interface SaveItineraryApprovalProps {
  isExistingItinerary: boolean;
  isRetrying: boolean;
  invocation: SaveItineraryToolInvocation;
  onRespond: (response: TripChatToolApprovalResponse) => void;
  onRetry: (itinerary: ItinerarySaveInput) => void;
  onKeepRefining: () => void;
}

export function SaveItineraryApproval({
  isExistingItinerary,
  isRetrying,
  invocation,
  onRespond,
  onRetry,
  onKeepRefining,
}: SaveItineraryApprovalProps) {
  if (invocation.state === 'input-streaming') {
    return (
      <p className="text-sm text-muted-foreground">Preparing itinerary…</p>
    );
  }

  if (invocation.state === 'input-available') {
    return <p className="text-sm text-muted-foreground">Itinerary prepared.</p>;
  }

  if (invocation.state === 'approval-requested') {
    const { days } = invocation.input.itinerary;

    if (invocation.approval.isAutomatic) {
      return <p className="text-sm text-muted-foreground">Checking consent…</p>;
    }

    return (
      <section className="mt-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="font-medium text-foreground">
          {isExistingItinerary
            ? 'Save these changes?'
            : `Save this ${days.length}-day itinerary?`}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isExistingItinerary
            ? 'This will replace your current itinerary. You can revise it again anytime.'
            : 'This saves your itinerary and opens it on the trip page.'}
        </p>

        <ol className="mt-3 space-y-1 text-sm text-foreground">
          {days.map((day) => (
            <li key={day.id} className="truncate">
              Day {day.dayNumber}: {day.title}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onPress={() =>
              onRespond({
                approvalId: invocation.approval.id,
                approved: true,
                toolCallId: invocation.toolCallId,
              })
            }
          >
            Save itinerary
          </Button>
          <Button
            variant="outline"
            onPress={() =>
              onRespond({
                approvalId: invocation.approval.id,
                approved: false,
                toolCallId: invocation.toolCallId,
              })
            }
          >
            Keep chatting
          </Button>
        </div>
      </section>
    );
  }

  if (invocation.state === 'approval-responded') {
    return (
      <p className="text-sm text-muted-foreground">
        {invocation.approval.approved
          ? 'Saving your itinerary…'
          : 'Save cancelled.'}
      </p>
    );
  }

  if (invocation.state === 'output-available') {
    return (
      <p className="text-sm text-muted-foreground">
        Itinerary saved. Opening your trip…
      </p>
    );
  }

  if (invocation.state === 'output-error') {
    const retryInput = itinerarySaveSchema.safeParse(
      invocation.input?.itinerary,
    );

    return (
      <section className="mt-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="font-medium text-destructive">
          The itinerary could not be saved.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your itinerary is still here. Try again or keep refining it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            isPending={isRetrying}
            isDisabled={!retryInput.success}
            onPress={() => {
              if (retryInput.success) {
                onRetry(retryInput.data);
              }
            }}
          >
            Try again
          </Button>
          <Button variant="outline" onPress={onKeepRefining}>
            Keep refining
          </Button>
        </div>
      </section>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      No problem—what would you like to change?
    </p>
  );
}
