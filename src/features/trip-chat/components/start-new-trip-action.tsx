import type { UIToolInvocation } from 'ai';

import { LinkButton } from '#/components/ui/button';

import type { startNewTripTool } from '../agents/trip-agent/tools/start-new-trip';

type StartNewTripToolInvocation = UIToolInvocation<typeof startNewTripTool>;

interface StartNewTripActionProps {
  invocation: StartNewTripToolInvocation;
}

export function StartNewTripAction({ invocation }: StartNewTripActionProps) {
  if (invocation.state === 'input-streaming') {
    return (
      <p className="text-sm text-muted-foreground">Preparing a new trip…</p>
    );
  }

  if (invocation.state === 'output-error') {
    return (
      <p className="text-sm text-destructive">
        We couldn’t prepare a new trip. Please try again.
      </p>
    );
  }

  if (invocation.state !== 'output-available') {
    return null;
  }

  return (
    <section className="mt-2 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="font-medium text-foreground">Start a separate trip?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This changes the destination you had already decided on, so we’ll keep
        this trip intact and start a fresh plan.
      </p>
      <LinkButton
        className="mt-4"
        to="/t/trips"
        search={{ prompt: invocation.output.prompt }}
      >
        Start a new trip
      </LinkButton>
    </section>
  );
}
