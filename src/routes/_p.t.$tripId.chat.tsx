import { createFileRoute } from '@tanstack/react-router';

import { motion } from 'motion/react';

import { Logo } from '#/components/logo';
import { Page } from '#/components/page';
import { site } from '#/config/site';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
import { CurrentUserAvatar } from '#/features/auth/components/current-user-avatar';
import { SiteDialogLink } from '#/features/site/components/site-dialog';
import { loadTrip, useTrip } from '#/features/trip/api/get-trip';
import { refreshTripMessages } from '#/features/trip-chat/api/get-trip-messages';
import { TripChat } from '#/features/trip-chat/components/trip-chat';
import { seo } from '#/lib/seo';

export const Route = createFileRoute('/_p/t/$tripId/chat')({
  component: Trip,
  async loader({ params, context }) {
    const [trip] = await Promise.all([
      loadTrip(context.queryClient, { tripId: params.tripId }),
      refreshTripMessages(context.queryClient, { tripId: params.tripId }),
    ]);
    return { trip };
  },
  head: ({ loaderData }) => ({
    meta: seo({
      title: [loaderData?.trip.title, 'Trip'],
    }),
  }),
});

function Trip() {
  const { tripId } = Route.useParams();

  return (
    <Page isScrollable={false}>
      <AnonymousUserBanner className="static" />

      <Page.Header>
        <Page.Brand>
          <Logo variant="light" size={28} />
        </Page.Brand>

        <Page.Actions>
          <Page.ActionLink to="/t/trips">Trips</Page.ActionLink>
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

      <Page.Main className="flex min-h-0 flex-col">
        <TripHeader tripId={tripId} />
        <div className="grid min-h-0 grow">
          <TripChat tripId={tripId} />
        </div>
      </Page.Main>
    </Page>
  );
}

function TripHeader({ tripId }: { tripId: string }) {
  const trip = useTrip({ tripId });

  return (
    <header
      data-tour="chat-conversation"
      className="box flex items-center gap-3 py-2.5 md:py-4 border-b border-muted lg:border-0 lg:gap-0"
    >
      <div className="min-w-0 flex-1">
        <motion.h1
          layout="position"
          className="truncate text-2xl font-medium tracking-tight"
        >
          {trip.title}
        </motion.h1>
        <p className="text-sm text-muted-foreground -mt-1">
          Chat and decide your itinerary
        </p>
      </div>
    </header>
  );
}
