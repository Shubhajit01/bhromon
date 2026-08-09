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

const signUpFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
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

interface SignUpFormValues {
  email: string;
  name: string;
}

interface SignUpFormProps {
  defaultValues: SignUpFormValues;
  onSuccess: () => Promise<void>;
  onSwitch: (values: SignUpFormValues) => void;
}

function SignUpForm({ defaultValues, onSuccess, onSwitch }: SignUpFormProps) {
  const [emailServerError, setEmailServerError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const form = useForm({
    defaultValues: { ...defaultValues, password: '' },
    validators: { onSubmit: signUpFormSchema },
    onSubmit: async ({ value }) => {
      setEmailServerError(undefined);
      setServerError(undefined);
      const input = signUpFormSchema.parse(value);

      try {
        const { error } = await authClient.signUp.email(input);

        if (error) {
          if (error.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
            setEmailServerError('An account with this email already exists.');
            return;
          }

          setServerError(
            error.message || 'We could not create your account. Try again.',
          );
          return;
        }

        await onSuccess();
      } catch (error) {
        setServerError(
          error instanceof Error && error.message
            ? error.message
            : 'We could not create your account.',
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
        <form.Field name="name">
          {(field) => {
            const errors = toFieldErrors(field.state.meta.errors);
            const isInvalid = errors.length > 0;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="name"
                  autoFocus
                  placeholder="Your name"
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

        <form.Field name="email">
          {(field) => {
            const errors = [
              ...toFieldErrors(field.state.meta.errors),
              ...(emailServerError ? [{ message: emailServerError }] : []),
            ];
            const isInvalid = errors.length > 0;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setEmailServerError(undefined);
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
                  autoComplete="new-password"
                  value={field.state.value}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    setServerError(undefined);
                    field.handleChange(event.target.value);
                  }}
                />
                <FieldDescription>Use at least 8 characters.</FieldDescription>
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
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </Button>
              <FieldDescription className="text-center flex items-center justify-center gap-2">
                Already have an account?{' '}
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  className="text-primary"
                  onPress={() => {
                    onSwitch({
                      email: form.state.values.email,
                      name: form.state.values.name,
                    });
                  }}
                >
                  Sign in
                </Button>
              </FieldDescription>
            </Field>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}

export { SignUpForm };
