import { useState } from 'react';

import type { ComponentProps } from 'react';

import { ArrowUpIcon, CircleNotchIcon, InfoIcon } from '@phosphor-icons/react';

import { Button } from '#/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '#/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '#/components/ui/input-group';
import {
  useInvalidateUserLimits,
  useUserLimits,
} from '#/features/auth/api/get-user-limits';
import { AuthDialog } from '#/features/auth/components/auth-dialog';
import {
  initTripInputSchema,
  MIN_PROMPT_LENGTH,
  useInitTrip,
} from '#/features/trip/api/init-trip';

import { useInvalidateTrips } from '../api/get-trips';
import { isGuestTripLimitError } from '../errors/guest-trip-limit-error';

interface TripPromptComposerProps {
  initialPrompt?: string;
  variant?: ComponentProps<typeof InputGroup>['variant'];
}

function TripPromptComposer({
  initialPrompt = '',
  variant = 'paper',
}: TripPromptComposerProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [wasGuestLimitReached, setWasGuestLimitReached] = useState(false);
  const { success: isValidPrompt } =
    initTripInputSchema.shape.prompt.safeParse(prompt);

  const initTrip = useInitTrip();
  const userLimits = useUserLimits();
  const invalidateUserLimits = useInvalidateUserLimits();
  const invalidateTrips = useInvalidateTrips();
  const savedTripLimit = userLimits.savedTrips;
  const isGuestLimitReached =
    savedTripLimit?.canCreate === false ||
    (wasGuestLimitReached && savedTripLimit !== null);
  const overlayCopy =
    variant === 'paper'
      ? {
          description: 'Claim your account to start another journey.',
          title: 'Your 3 guest trips are safe.',
        }
      : {
          description: 'Claim your account to start planning again.',
          title: 'Ready for another journey?',
        };

  const handleSubmit = async (event: React.SubmitEvent) => {
    event.preventDefault();
    if (isGuestLimitReached) return;

    initTrip.mutate(
      { prompt },
      {
        onError: (error) => {
          if (isGuestTripLimitError(error)) {
            setWasGuestLimitReached(true);
            void invalidateUserLimits();
            void invalidateTrips();
            return;
          }

          setSubmitError('We couldn’t start your trip. Please try again.');
        },
      },
    );
  };

  return (
    <>
      <form className="w-full" onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="trip-prompt" className="sr-only">
              Describe the trip you want to plan
            </FieldLabel>
            <InputGroup variant={variant}>
              <InputGroupTextarea
                id="trip-prompt"
                name="trip-prompt"
                required
                disabled={initTrip.isPending || isGuestLimitReached}
                rows={6}
                enterKeyHint="send"
                placeholder="I want a food-and-train journey through Japan in October…"
                className="h-20 max-h-20 sm:max-h-24 px-5 pt-4 sm:min-h-24 text-lg!"
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  setSubmitError(null);
                }}
              />
              <InputGroupAddon align="block-end" className="px-4 pb-4">
                <InputGroupText
                  aria-atomic="true"
                  aria-live="polite"
                  role="status"
                >
                  {initTrip.isPending ? (
                    <span className="font-normal inline-flex items-center gap-1 animate-in fade-in text-primary">
                      <CircleNotchIcon
                        aria-hidden="true"
                        className="animate-spin"
                        weight="bold"
                      />
                      Starting your trip plan…
                    </span>
                  ) : submitError ? (
                    <span className="font-normal text-destructive inline-flex items-center gap-1 animate-in fade-in">
                      {submitError}
                    </span>
                  ) : prompt.length >= MIN_PROMPT_LENGTH / 4 &&
                    !isValidPrompt ? (
                    <span className="font-normal text-destructive inline-flex items-center gap-1 animate-in fade-in">
                      <InfoIcon aria-hidden="true" weight="bold" />
                      Make it longer with atleast {MIN_PROMPT_LENGTH} characters
                    </span>
                  ) : null}
                </InputGroupText>
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  aria-label={
                    initTrip.isPending
                      ? 'Starting your trip plan'
                      : 'Start planning'
                  }
                  isDisabled={
                    initTrip.isPending || isGuestLimitReached || !isValidPrompt
                  }
                  className="ml-auto"
                >
                  <ArrowUpIcon weight="bold" />
                </InputGroupButton>
              </InputGroupAddon>

              {isGuestLimitReached ? (
                <div
                  aria-labelledby="guest-trip-limit-title"
                  aria-describedby="guest-trip-limit-description"
                  data-trip-limit-overlay
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-background/78 px-6 text-center text-foreground backdrop-blur-sm"
                >
                  <p id="guest-trip-limit-title" className="font-medium">
                    {overlayCopy.title}
                  </p>
                  <p
                    id="guest-trip-limit-description"
                    className="max-w-sm text-sm text-muted-foreground"
                  >
                    {overlayCopy.description}
                  </p>
                  <Button
                    className="mt-1"
                    size="sm"
                    onPress={() => setIsClaimDialogOpen(true)}
                  >
                    Claim account
                  </Button>
                </div>
              ) : null}
            </InputGroup>
          </Field>
        </FieldGroup>
      </form>

      <AuthDialog
        defaultMode="sign-up"
        isOpen={isClaimDialogOpen}
        onOpenChange={setIsClaimDialogOpen}
      />
    </>
  );
}

export { TripPromptComposer };
