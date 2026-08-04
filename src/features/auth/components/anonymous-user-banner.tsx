import { CircleWavyWarningIcon } from '@phosphor-icons/react';

import { Button } from '#/components/ui/button';
import { cn } from '#/lib/utils';

import { useCurrentUser } from '../api/get-current-user';

function AnonymousUserBanner({
  className,
  ...props
}: React.ComponentProps<'aside'>) {
  const isAnonymous = useCurrentUser((s) => s.isAnonymous);

  if (!isAnonymous) {
    return null;
  }

  return (
    <aside
      aria-label="Guest account notice"
      className={cn('bg-primary w-full sticky top-0 left-0 z-2', className)}
      {...props}
    >
      <div className="box py-2.5 flex items-center gap-4">
        <CircleWavyWarningIcon
          aria-hidden="true"
          size={28}
          weight="fill"
          className="text-primary-foreground hidden sm:inline"
        />
        <div className="text-primary-foreground mr-auto text-pretty">
          <p className="text-sm sm:text-base font-medium">
            You&apos;re exploring as a guest.
          </p>
          <p className="text-xs sm:text-sm text-primary-foreground/75 -mt-1">
            Claim this account to keep your trips safe and available anytime.
          </p>
        </div>

        <Button size="sm" variant="outline">
          Claim
        </Button>
      </div>
    </aside>
  );
}

export { AnonymousUserBanner };
