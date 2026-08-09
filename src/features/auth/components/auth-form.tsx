import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { ANCHOR_KEYS } from '#/config/anchor-keys';

import { SignInForm } from './sign-in-form';
import { SignUpForm } from './sign-up-form';

type AuthFormMode = 'sign-in' | 'sign-up';

interface AuthFormProps {
  defaultMode?: AuthFormMode;
  onSuccess: () => Promise<void> | void;
}

interface AuthDraft {
  email: string;
  name: string;
}

function AuthForm({ defaultMode = 'sign-in', onSuccess }: AuthFormProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AuthFormMode>(defaultMode);
  const [draft, setDraft] = useState<AuthDraft>({ email: '', name: '' });
  const isSignUp = mode === 'sign-up';

  async function handleSuccess() {
    await queryClient.invalidateQueries({
      queryKey: [ANCHOR_KEYS.CURRENT_USER],
    });
    await onSuccess();
  }

  return (
    <>
      <DialogHeader className="gap-0.5">
        <DialogTitle className="text-lg font-medium">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </DialogTitle>
        <DialogDescription>
          {isSignUp
            ? 'Keep your journeys safe and available wherever you go.'
            : 'Sign in to continue planning your journeys.'}
        </DialogDescription>
      </DialogHeader>

      {isSignUp ? (
        <SignUpForm
          defaultValues={draft}
          onSuccess={handleSuccess}
          onSwitch={(values) => {
            setDraft(values);
            setMode('sign-in');
          }}
        />
      ) : (
        <SignInForm
          defaultEmail={draft.email}
          onSuccess={handleSuccess}
          onSwitch={(email) => {
            setDraft((current) => ({ ...current, email }));
            setMode('sign-up');
          }}
        />
      )}
    </>
  );
}

export { AuthForm };
export type { AuthFormMode };
