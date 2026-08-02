import { useState } from 'react';

import { PaperPlaneTiltIcon } from '@phosphor-icons/react';

import { Field, FieldGroup, FieldLabel } from '#/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '#/components/ui/input-group';
import { useInitTrip } from '#/features/trip/api/init-trip';

function TripPromptComposer() {
  const [prompt, setPrompt] = useState('');
  const initTrip = useInitTrip();

  return (
    <form
      className="w-full"
      onSubmit={(event) => {
        event.preventDefault();
        initTrip.mutate({ prompt });
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="trip-prompt" className="sr-only">
            Describe the trip you want to plan
          </FieldLabel>
          <InputGroup variant="paper">
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
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                aria-label="Start planning"
                isDisabled={initTrip.isPending}
                className="ml-auto"
              >
                <PaperPlaneTiltIcon weight="bold" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
    </form>
  );
}

export { TripPromptComposer };
