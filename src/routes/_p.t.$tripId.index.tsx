import { createFileRoute } from '@tanstack/react-router';

import {
  CalendarBlankIcon,
  HourglassSimpleIcon,
  RobotIcon,
} from '@phosphor-icons/react';

import { Logo } from '#/components/logo';
import { Page } from '#/components/page';
import { Badge } from '#/components/ui/badge';
import { LinkButton } from '#/components/ui/button';
import { site } from '#/config/site';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
import { CurrentUserAvatar } from '#/features/auth/components/current-user-avatar';
import { loadTrip, useTrip } from '#/features/trip/api/get-trip';
import { ItineraryDay } from '#/features/trip/components/itinerary-day';
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
  const days = revision?.content.days;
  const dateRange = days
    ? formatItineraryDateRange(days.map((day) => day.date))
    : undefined;

  return (
    <Page>
      <AnonymousUserBanner className="static" />

      <Page.Header>
        <Page.Brand>
          <Logo variant="light" size={28} />
          <span>{site.name}</span>
        </Page.Brand>

        <Page.Actions>
          <Page.ActionLink to="/t/trips">My Trips</Page.ActionLink>
          <CurrentUserAvatar />
        </Page.Actions>
      </Page.Header>

      <Page.Main className="flex flex-col gap-3 bg-background">
        <header>
          <div className="flex box flex-col gap-3 sm:gap-6 pt-6 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex flex-col gap-1">
              <h1 className="text-balance text-3xl font-medium tracking-tight text-foreground sm:text-2xl">
                {trip.title}
              </h1>

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
      </Page.Main>
    </Page>
  );
}
