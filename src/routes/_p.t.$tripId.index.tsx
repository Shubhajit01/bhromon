import { createFileRoute } from '@tanstack/react-router';

import {
  CalendarBlankIcon,
  HourglassSimpleIcon,
  RobotIcon,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';

import { Logo } from '#/components/logo';
import { Page } from '#/components/page';
import { Badge } from '#/components/ui/badge';
import { LinkButton } from '#/components/ui/button';
import { site } from '#/config/site';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
import { CurrentUserAvatar } from '#/features/auth/components/current-user-avatar';
import { ScreenTour } from '#/features/product-tour/components/screen-tour';
import { SiteDialogLink } from '#/features/site/components/site-dialog';
import { loadTrip, useTrip } from '#/features/trip/api/get-trip';
import { ItineraryDay } from '#/features/trip/components/itinerary-day';
import { ItineraryMap } from '#/features/trip/components/itinerary-map';
import { TripItineraryEmpty } from '#/features/trip/components/trip-itinerary-empty';
import {
  formatItineraryDateRange,
  getCurrentItineraryRevision,
} from '#/features/trip/utils/trip-itinerary';
import { seo } from '#/lib/seo';

export const Route = createFileRoute('/_p/t/$tripId/')({
  component: RouteComponent,
  async loader({ context, params }) {
    const trip = await loadTrip(context.queryClient, { tripId: params.tripId });
    return { trip };
  },
  head: ({ loaderData }) => ({
    meta: seo({ title: [loaderData?.trip.title, 'Trip'] }),
  }),
});

function RouteComponent() {
  const { tripId } = Route.useParams();
  const trip = useTrip({ tripId });

  const revision = getCurrentItineraryRevision(trip.itineraryRevisions);
  const days = revision?.days;
  const dateRange = days
    ? formatItineraryDateRange(days.map((day) => day.date))
    : undefined;
  const usesGeoapify = days?.some((day) =>
    day.visits.some((visit) =>
      visit.place.externalIds.some(
        (externalId) => externalId.provider === 'geoapify',
      ),
    ),
  );

  return (
    <Page>
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

      <Page.Main className="flex flex-col gap-3 bg-background">
        <header>
          <div
            data-tour="itinerary-overview"
            className="flex box flex-col gap-3 sm:gap-6 pt-6 pb-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex flex-col gap-1">
              <motion.h1
                layout="position"
                className="text-balance text-3xl font-medium tracking-tight text-foreground sm:text-2xl"
              >
                {trip.title}
              </motion.h1>

              <div className="flex gap-2">
                {dateRange ? (
                  <Badge variant="secondary">
                    <CalendarBlankIcon
                      weight="duotone"
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    {dateRange}
                  </Badge>
                ) : null}

                {days ? (
                  <Badge variant="secondary">
                    <HourglassSimpleIcon
                      weight="duotone"
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    {days.length === 1 ? '1 day' : `${days.length} days`}
                  </Badge>
                ) : null}
              </div>
            </div>

            {revision ? (
              <LinkButton
                data-tour="itinerary-open-chat"
                size="default"
                params={{ tripId }}
                to="/t/$tripId/chat"
                className="shrink-0"
              >
                <RobotIcon weight="bold" />
                Open Chat
              </LinkButton>
            ) : null}
          </div>
        </header>

        <div className="box sm:pt-2 pb-6">
          {days ? (
            <div className="flex flex-col gap-4">
              <ItineraryMap
                revision={revision}
                usesGeoapify={usesGeoapify ?? false}
              />
              {days.map((day) => (
                <ItineraryDay key={day.id} day={day} />
              ))}
            </div>
          ) : (
            <TripItineraryEmpty
              action={
                <LinkButton to="/t/$tripId/chat" params={{ tripId }} size="lg">
                  Plan this trip
                </LinkButton>
              }
            />
          )}
        </div>

        <ScreenTour
          id="itinerary"
          steps={[
            {
              target: '[data-tour="itinerary-overview"]',
              title: revision
                ? 'Review your journey'
                : 'Your itinerary lives here',
              content: revision
                ? 'Follow the trip day by day, with each place and timing kept in the order you approved.'
                : 'Once you save a plan in chat, its day-by-day itinerary will appear here.',
            },
            ...(revision
              ? [
                  {
                    target: '[data-tour="itinerary-open-chat"]',
                    title: 'Keep shaping the plan',
                    content:
                      'Return to the conversation whenever you want to revise this journey.',
                  },
                ]
              : []),
          ]}
        />
      </Page.Main>
    </Page>
  );
}
