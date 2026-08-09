import { Dialog } from '#/components/ui/dialog';

import { AuthForm } from './auth-form';

import type { AuthFormMode } from './auth-form';

interface AuthDialogProps {
  closeable?: boolean;
  defaultMode?: AuthFormMode;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

function AuthDialog({
  closeable = true,
  defaultMode = 'sign-in',
  isOpen,
  onOpenChange,
}: AuthDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={closeable}
      isKeyboardDismissDisabled={!closeable}
      showCloseButton={closeable}
    >
      <AuthForm
        defaultMode={defaultMode}
        onSuccess={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

export { AuthDialog };
export type { AuthDialogProps };
