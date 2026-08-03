import { Suspense } from 'react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { z } from 'zod';

import { Logo } from '#/components/logo';
import { useCurrentUser } from '#/features/auth/api/get-current-user';
import { CurrentUserAvatar } from '#/features/auth/components/current-user-avatar';
import { loadTrips } from '#/features/trip/api/get-trips';
import {
  TripList,
  TripListFallback,
} from '#/features/trip/components/trip-list';
import { TripPromptComposer } from '#/features/trip/components/trip-prompt-composer';
import { TripStatusFilter } from '#/features/trip/components/trip-status-filter';
import { tripStatusFilterSchema } from '#/features/trip/types/trip-status-filter';
import { seo } from '#/lib/seo';

const tripSearchSchema = z.object({
  status: tripStatusFilterSchema.catch('all'),
});

export const Route = createFileRoute('/_protected/t/')({
  validateSearch: tripSearchSchema,
  loader: ({ context }) => {
    void loadTrips(context.queryClient);
  },
  head: () => ({
    meta: seo({ title: 'Your trips' }),
  }),
  component: TripsPage,
});

function TripsPage() {
  const name = useCurrentUser((s) => s.name);
  const isAnonymous = useCurrentUser((s) => s.isAnonymous);

  const status = Route.useSearch({
    select: (s) => s.status,
  });

  return (
    <main className="min-h-svh bg-background flex flex-col gap-8 items-stretch">
      <header className="flex gap-4 pt-12 items-center justify-between box sm:pt-16">
        <Link to="/">
          <Logo variant="light" size={28} />
        </Link>

        <CurrentUserAvatar />
      </header>

      <section className="text-left gap-4 flex flex-col box">
        <h1 className="mt-3 text-balance text-3xl text-foreground">
          Hi {isAnonymous ? 'there' : name}, Where will we wander next?
        </h1>

        <TripPromptComposer variant="default" />
      </section>

      <section
        className="pb-12 sm:pb-16 box"
        aria-labelledby="trip-list-heading"
      >
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2
            id="trip-list-heading"
            className="text-2xl font-medium tracking-[-0.02em] text-foreground"
          >
            Your trips
          </h2>
          <TripStatusFilter status={status} />
        </div>

        <Suspense fallback={<TripListFallback />}>
          <TripList status={status} />
        </Suspense>
      </section>
    </main>
  );
}
