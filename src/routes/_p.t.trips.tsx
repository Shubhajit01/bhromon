import { Suspense } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { z } from 'zod';

import { Logo } from '#/components/logo';
import { Page } from '#/components/page';
import { site } from '#/config/site';
import { useCurrentUser } from '#/features/auth/api/get-current-user';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
import { CurrentUserAvatar } from '#/features/auth/components/current-user-avatar';
import { ScreenTour } from '#/features/product-tour/components/screen-tour';
import { SiteDialogLink } from '#/features/site/components/site-dialog';
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
  prompt: z.string().trim().min(1).max(4000).optional().catch(undefined),
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
  const prompt = Route.useSearch({
    select: (s) => s.prompt,
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
          <SiteDialogLink
            kind="about"
            className="px-0 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
          />
          <SiteDialogLink
            kind="contact"
            className="px-0 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
          />
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

          <div data-tour="trips-new-trip" className="backdrop-blur-sm">
            <TripPromptComposer initialPrompt={prompt} variant="default" />
          </div>
        </section>

        <section
          className="pb-12 sm:pb-16 box"
          aria-labelledby="trip-list-heading"
        >
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2
              id="trip-list-heading"
              data-tour="trips-list"
              className="text-xl font-medium tracking-[-0.02em] text-foreground"
            >
              Your trips
            </h2>
            <div data-tour="trips-filter">
              <TripStatusFilter status={status} />
            </div>
          </div>

          <Suspense fallback={<TripListFallback />}>
            <TripList status={status} />
          </Suspense>
        </section>

        <ScreenTour
          id="trips"
          steps={[
            {
              target: '[data-tour="trips-new-trip"]',
              title: 'Start another journey',
              content:
                'Describe a new trip here whenever you are ready to plan somewhere new.',
            },
            {
              target: '[data-tour="trips-filter"]',
              title: 'Find the plan you need',
              content:
                'Show every trip, saved itineraries, or journeys that still need planning.',
            },
            {
              target: '[data-tour="trips-list"]',
              title: 'Pick up where you left off',
              content:
                'Open any journey to review its itinerary or continue shaping the plan.',
            },
          ]}
        />
      </Page.Main>
    </Page>
  );
}
