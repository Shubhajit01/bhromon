import { useState } from 'react';

import type { ComponentProps } from 'react';

import { ArrowUpIcon, InfoIcon } from '@phosphor-icons/react';

import { Field, FieldGroup, FieldLabel } from '#/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '#/components/ui/input-group';
import {
  initTripInputSchema,
  MIN_PROMPT_LENGTH,
  useInitTrip,
} from '#/features/trip/api/init-trip';

import { useInvalidateTrips } from '../api/get-trips';

interface TripPromptComposerProps {
  variant?: ComponentProps<typeof InputGroup>['variant'];
}

function TripPromptComposer({ variant = 'paper' }: TripPromptComposerProps) {
  const [prompt, setPrompt] = useState('');
  const { success: isValidPrompt } = initTripInputSchema.safeParse({ prompt });

  const initTrip = useInitTrip();
  const invalidateTrips = useInvalidateTrips();

  const handleSubmit = async (event: React.SubmitEvent) => {
    event.preventDefault();
    initTrip.mutate({ prompt }, { onSuccess: () => invalidateTrips() });
  };

  return (
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
              disabled={initTrip.isPending}
              rows={6}
              enterKeyHint="send"
              placeholder="I want a food-and-train journey through Japan in October…"
              className="h-20 max-h-20 sm:max-h-24 px-5 pt-4 sm:min-h-24 text-lg!"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <InputGroupAddon align="block-end" className="px-4 pb-4">
              <InputGroupText>
                {prompt.length >= MIN_PROMPT_LENGTH / 4 && !isValidPrompt ? (
                  <span className="font-normal text-destructive inline-flex items-center gap-1 animate-in fade-in">
                    <InfoIcon weight="bold" />
                    Make it longer with atleast {MIN_PROMPT_LENGTH} characters
                  </span>
                ) : null}
              </InputGroupText>
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                aria-label="Start planning"
                isDisabled={initTrip.isPending || !isValidPrompt}
                className="ml-auto"
              >
                <ArrowUpIcon weight="bold" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
    </form>
  );
}

export { TripPromptComposer };
