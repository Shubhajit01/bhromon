import type { ReactNode } from 'react';

import mountainStencil from '#/assets/images/mountain-stencil.png';

interface TripItineraryEmptyProps {
  action: ReactNode;
}

export function TripItineraryEmpty({ action }: TripItineraryEmptyProps) {
  return (
    <section className="relative flex min-h-80 items-start overflow-hidden rounded-2xl bg-muted/50 px-6 py-10 sm:min-h-96 sm:px-10 sm:py-12">
      <img
        src={mountainStencil}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full translate-y-1/4 opacity-[0.08]"
      />
      <div className="relative z-10 max-w-md">
        <h2 className="text-balance text-xl font-medium tracking-[-0.02em]">
          Shape your first day
        </h2>
        <p className="mt-2 text-pretty leading-7 text-muted-foreground">
          Tell Bhromon what matters to you. Your day-by-day plan will take shape
          here as you decide together.
        </p>
        <div className="mt-6">{action}</div>
      </div>
    </section>
  );
}
