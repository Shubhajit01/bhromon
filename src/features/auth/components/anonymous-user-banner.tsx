import { useState } from 'react';

import { CircleWavyWarningIcon } from '@phosphor-icons/react';

import { Button } from '#/components/ui/button';
import { cn } from '#/lib/utils';

import { useCurrentUser } from '../api/get-current-user';
import { useUserLimits } from '../api/get-user-limits';
import { AuthDialog } from './auth-dialog';

function AnonymousUserBanner({
  className,
  ...props
}: React.ComponentProps<'aside'>) {
  const isAnonymous = useCurrentUser((s) => s.isAnonymous);
  const userLimits = useUserLimits();
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);

  if (!isAnonymous) {
    return null;
  }

  return (
    <>
      <aside
        aria-label="Guest account notice"
        className={cn('bg-accent w-full sticky top-0 left-0 z-2', className)}
        {...props}
      >
        <div className="box py-2.5 flex items-center gap-4">
          <CircleWavyWarningIcon
            aria-hidden="true"
            size={28}
            weight="fill"
            className="text-secondary-foreground hidden sm:inline"
          />
          <div className="mr-auto text-pretty">
            <p className="text-sm sm:text-base font-medium">
              You&apos;re exploring as a guest.
            </p>
            <p className="text-xs sm:text-sm text-accent-foreground/75 -mt-1">
              {userLimits.savedTrips?.canCreate
                ? `You can save ${userLimits.savedTrips.remaining} more ${userLimits.savedTrips.remaining === 1 ? 'trip' : 'trips'} before claiming your account.`
                : 'Claim your account to keep planning.'}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onPress={() => setIsClaimDialogOpen(true)}
          >
            Claim account
          </Button>
        </div>
      </aside>

      <AuthDialog
        defaultMode="sign-up"
        isOpen={isClaimDialogOpen}
        onOpenChange={setIsClaimDialogOpen}
      />
    </>
  );
}

export { AnonymousUserBanner };
