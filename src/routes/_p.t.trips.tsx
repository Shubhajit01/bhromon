import { Suspense } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { z } from 'zod';

import { Logo } from '#/components/logo';
import { Page } from '#/components/page';
import { site } from '#/config/site';
import { useCurrentUser } from '#/features/auth/api/get-current-user';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
import { CurrentUserAvatar } from '#/features/auth/components/current-user-avatar';
import { loadTrips } from '#/features/trip/api/get-trips';
import {
  TripList,
  TripListFallback,
} from '#/features/trip/components/trip-list';
import { TripPromptComposer } from '#/features/trip/components/trip-prompt-composer';
import { TripStatusFilter } from '#/features/trip/components/trip-status-filter';
import { tripStatusFilterSchema } from '#/features/trip/types/trip-status-filter';
import { preloadImage } from '#/lib/helpers';
import { seo } from '#/lib/seo';

import mountainBgAvif from '#/assets/images/mountain-stencil.png?grayscale&w=850&format=avif&enhanced';
import mountainBgWebp from '#/assets/images/mountain-stencil.png?grayscale&w=850&format=webp&enhanced';

const tripSearchSchema = z.object({
  status: tripStatusFilterSchema.nullish().default('all').catch('all'),
});

export const Route = createFileRoute('/_p/t/trips')({
  validateSearch: tripSearchSchema,
  loader: ({ context }) => {
    preloadImage(mountainBgWebp);
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
    <Page>
      <picture
        aria-hidden="true"
        className="fixed left-0 bottom-0 w-full h-full md:w-3/4 md:h-3/4 xl:w-2/4 xl:h-2/4 opacity-10"
      >
        <source srcSet={mountainBgAvif} type="image/avif" />
        <img
          alt=""
          src={mountainBgWebp}
          className="object-contain size-full select-none pointer-events-none object-center sm:object-bottom mix-blend-multiply dark:invert"
        />
      </picture>

      <AnonymousUserBanner className="static" />

      <Page.Header>
        <Page.Brand>
          <Logo variant="light" size={28} />
        </Page.Brand>

        <Page.Actions>
          <Page.ActionLink to="/">About</Page.ActionLink>
          <Page.ActionLink to="/">Contact</Page.ActionLink>
          <CurrentUserAvatar />
        </Page.Actions>
      </Page.Header>

      <Page.Main
        data-anonymous={isAnonymous}
        className="group flex flex-col gap-8 items-stretch isolate pt-8 pb-8 sm:pb-12 sm:pt-10"
      >
        <section className="text-left gap-4 flex flex-col box">
          <h1 className="text-balance text-2xl sm:text-3xl tracking-tight text-foreground">
            Hi {isAnonymous ? 'there' : name}, Where will we wander next?
          </h1>

          <div className="backdrop-blur-sm">
            <TripPromptComposer variant="default" />
          </div>
        </section>

        <section
          className="pb-12 sm:pb-16 box"
          aria-labelledby="trip-list-heading"
        >
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2
              id="trip-list-heading"
              className="text-xl font-medium tracking-[-0.02em] text-foreground"
            >
              Your trips
            </h2>
            <TripStatusFilter status={status} />
          </div>

          <Suspense fallback={<TripListFallback />}>
            <TripList status={status} />
          </Suspense>
        </section>
      </Page.Main>
    </Page>
  );
}
