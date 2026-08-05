import { useId, useState } from 'react';

import type { FormEvent, KeyboardEvent } from 'react';

import { ArrowUpIcon, StopIcon } from '@phosphor-icons/react';

import { Field, FieldGroup, FieldLabel } from '#/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '#/components/ui/input-group';

interface ComposeTripChatComposerProps {
  mode: 'compose';
  onSend: (prompt: string) => void;
}

interface StopTripChatComposerProps {
  mode: 'stop';
  onStop: () => void;
}

interface UnavailableTripChatComposerProps {
  mode: 'unavailable';
}

type TripChatComposerProps =
  | ComposeTripChatComposerProps
  | StopTripChatComposerProps
  | UnavailableTripChatComposerProps;

export function TripChatComposer(props: TripChatComposerProps) {
  const [prompt, setPrompt] = useState('');
  const inputId = useId();
  const normalizedPrompt = prompt.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (props.mode !== 'compose' || !normalizedPrompt) {
      return;
    }

    props.onSend(normalizedPrompt);
    setPrompt('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      props.mode !== 'compose'
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  const isComposeMode = props.mode === 'compose';
  const isUnavailable = props.mode === 'unavailable';

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={inputId} className="sr-only">
            Reply to the message
          </FieldLabel>
          <InputGroup variant="default">
            <InputGroupTextarea
              required={isComposeMode}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handleKeyDown}
              id={inputId}
              name={inputId}
              rows={2}
              enterKeyHint="send"
              className="min-h-20 max-h-40 overflow-y-auto px-5 pt-4 text-base!"
              placeholder="Make day two slower, swap a flight for a train, or add somewhere local…"
            />
            <InputGroupAddon align="block-end" className="px-4 pb-4">
              <InputGroupButton
                type={isComposeMode ? 'submit' : 'button'}
                variant="default"
                size="icon-sm"
                aria-label={
                  isComposeMode
                    ? 'Send reply'
                    : isUnavailable
                      ? 'Reconnecting'
                      : 'Stop generating'
                }
                className="ml-auto size-11"
                isDisabled={
                  isUnavailable || (isComposeMode && !normalizedPrompt)
                }
                onPress={props.mode === 'stop' ? props.onStop : undefined}
              >
                {props.mode === 'stop' ? (
                  <StopIcon weight="fill" />
                ) : (
                  <ArrowUpIcon weight="bold" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </FieldGroup>
    </form>
  );
}
