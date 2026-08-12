import { useState } from 'react';

import type { ReactNode } from 'react';

import { ClientOnly } from '@tanstack/react-router';

import { XIcon } from '@phosphor-icons/react';
import { ACTIONS, Joyride, STATUS } from 'react-joyride';

import type { EventData, Step, TooltipRenderProps } from 'react-joyride';

import { Button } from '#/components/ui/button';

type ScreenTourId = 'chat' | 'home' | 'itinerary' | 'trips';

interface ScreenTourStep {
  content: ReactNode;
  placement?: Step['placement'];
  target: Step['target'];
  title: ReactNode;
}

interface ScreenTourProps {
  id: ScreenTourId;
  steps: ScreenTourStep[];
}

const SCREEN_TOUR_VERSION = 1;

function ScreenTour({ id, steps }: ScreenTourProps) {
  const storageKey = `bhromon:screen-tour:${id}:v${SCREEN_TOUR_VERSION}`;

  return (
    <ClientOnly>
      <ClientScreenTour storageKey={storageKey} steps={steps} />
    </ClientOnly>
  );
}

interface ClientScreenTourProps {
  steps: ScreenTourStep[];
  storageKey: string;
}

function ClientScreenTour({ storageKey, steps }: ClientScreenTourProps) {
  const [isRunning, setIsRunning] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) !== 'seen';
    } catch {
      return false;
    }
  });
  const [prefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const markAsSeen = () => {
    setIsRunning(false);

    try {
      window.localStorage.setItem(storageKey, 'seen');
    } catch {
      // Closing the tour should still work when browser storage is unavailable.
    }
  };

  const handleEvent = ({ action, status }: EventData) => {
    if (
      action === ACTIONS.CLOSE ||
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED
    ) {
      markAsSeen();
    }
  };

  return (
    <Joyride
      continuous
      floatingOptions={{
        autoUpdate: { ancestorResize: true, ancestorScroll: true },
        flipOptions: { padding: 16 },
        shiftOptions: { padding: 16 },
        strategy: 'fixed',
      }}
      run={isRunning}
      steps={steps}
      tooltipComponent={ProductTourTooltip}
      locale={{
        back: 'Back',
        close: 'Close tour',
        last: 'Done',
        next: 'Next',
      }}
      onEvent={handleEvent}
      options={{
        arrowColor: 'var(--popover)',
        backgroundColor: 'var(--popover)',
        blockTargetInteraction: true,
        buttons: ['back', 'close', 'primary'],
        closeButtonAction: 'skip',
        dismissKeyAction: 'close',
        offset: 12,
        overlayClickAction: false,
        overlayColor: 'color-mix(in oklch, var(--foreground) 58%, transparent)',
        primaryColor: 'var(--primary)',
        scrollDuration: prefersReducedMotion ? 0 : 200,
        scrollOffset: 24,
        skipBeacon: true,
        skipScroll: true,
        spotlightPadding: 6,
        spotlightRadius: 18,
        targetWaitTimeout: 1500,
        textColor: 'var(--popover-foreground)',
        width: 'min(20rem, calc(100vw - 2rem))',
        zIndex: 70,
      }}
      styles={
        prefersReducedMotion
          ? {
              floater: { transition: 'none' },
              overlay: { transition: 'none' },
              tooltip: { transition: 'none' },
            }
          : undefined
      }
    />
  );
}

function ProductTourTooltip({
  backProps,
  closeProps,
  index,
  isLastStep,
  primaryProps,
  size,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <section
      aria-modal={tooltipProps['aria-modal']}
      data-product-tour
      role="alertdialog"
      className="w-full max-w-80 rounded-2xl bg-popover p-4 text-popover-foreground shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {step.title ? (
            <h2 className="text-balance text-base font-medium tracking-tight">
              {step.title}
            </h2>
          ) : null}
          <div className="mt-1 text-pretty text-sm leading-5 text-muted-foreground">
            {step.content}
          </div>
        </div>

        <Button
          aria-label={closeProps['aria-label']}
          data-action={closeProps['data-action']}
          title={closeProps.title}
          variant="ghost"
          size="icon-xs"
          className="-mr-1 -mt-1"
          onClick={(event) => closeProps.onClick(event)}
        >
          <XIcon aria-hidden="true" weight="bold" />
        </Button>
      </div>

      <footer className="mt-4 flex items-center gap-2">
        <p className="mr-auto text-xs font-medium text-muted-foreground">
          {index + 1} of {size}
        </p>

        {index > 0 ? (
          <Button
            aria-label={backProps['aria-label']}
            data-action={backProps['data-action']}
            title={backProps.title}
            variant="outline"
            size="sm"
            onClick={(event) => backProps.onClick(event)}
          >
            Back
          </Button>
        ) : null}

        <Button
          aria-label={primaryProps['aria-label']}
          data-action={primaryProps['data-action']}
          title={primaryProps.title}
          size="sm"
          onClick={(event) => primaryProps.onClick(event)}
        >
          {isLastStep ? 'Done' : 'Next'}
        </Button>
      </footer>
    </section>
  );
}

export { ScreenTour };
export type { ScreenTourStep };
