import { useState } from 'react';

import { useForm } from '@tanstack/react-form';

import { CircleNotchIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { z } from 'zod';

import { Alert, AlertDescription } from '#/components/ui/alert';
import { Button } from '#/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import { authClient } from '#/lib/auth-client';
import { toFieldErrors } from '#/utils/form';

import { PasswordInput } from './password-input';

const signInFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter a valid email address.')),
  password: z
    .string()
    .min(1, 'Enter your password.')
    .pipe(z.string().min(8, 'Password must be at least 8 characters.')),
});

interface SignInFormProps {
  defaultEmail: string;
  onSuccess: () => Promise<void>;
  onSwitch: (email: string) => void;
}

function SignInForm({ defaultEmail, onSuccess, onSwitch }: SignInFormProps) {
  const [serverError, setServerError] = useState<string>();
  const form = useForm({
    defaultValues: { email: defaultEmail, password: '' },
    validators: { onSubmit: signInFormSchema },
    onSubmit: async ({ value }) => {
      setServerError(undefined);
      const input = signInFormSchema.parse(value);

      try {
        const { error } = await authClient.signIn.email(input);

        if (error) {
          setServerError(
            error.message || 'We could not sign you in. Try again.',
          );
          return;
        }

        await onSuccess();
      } catch (error) {
        setServerError(
          error instanceof Error && error.message
            ? error.message
            : 'We could not sign you in.',
        );
      }
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="email">
          {(field) => {
            const errors = toFieldErrors(field.state.meta.errors);
            const isInvalid = errors.length > 0;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setServerError(undefined);
                    field.handleChange(event.target.value);
                  }}
                />
                <FieldError errors={errors} />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const errors = toFieldErrors(field.state.meta.errors);
            const isInvalid = errors.length > 0;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <PasswordInput
                  id={field.name}
                  name={field.name}
                  autoComplete="current-password"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setServerError(undefined);
                    field.handleChange(event.target.value);
                  }}
                />
                <FieldError errors={errors} />
              </Field>
            );
          }}
        </form.Field>

        {serverError ? (
          <Alert variant="destructive">
            <WarningCircleIcon />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Field>
              <Button type="submit" isDisabled={isSubmitting}>
                {isSubmitting ? (
                  <CircleNotchIcon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : null}
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
              <FieldDescription className="text-center">
                New to Bhromon?{' '}
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  className="text-primary"
                  onPress={() => onSwitch(form.state.values.email)}
                >
                  Create an account
                </Button>
              </FieldDescription>
            </Field>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}

export { SignInForm };
