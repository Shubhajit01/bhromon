import { useState } from 'react';

import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#/components/ui/input-group';

type PasswordInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  'type'
>;

function PasswordInput(props: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput type={isVisible ? 'text' : 'password'} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          onPress={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput };
