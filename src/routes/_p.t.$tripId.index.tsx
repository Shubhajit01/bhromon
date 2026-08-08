import { createFileRoute, notFound } from '@tanstack/react-router';

import { ArrowLeftIcon, CalendarBlankIcon } from '@phosphor-icons/react';

import { LinkButton } from '#/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
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

    if (!trip) {
      throw notFound();
    }

    return { trip };
  },
  head: ({ loaderData }) => ({
    meta: seo({ title: [loaderData?.trip.title, 'Trip'] }),
  }),
  notFoundComponent: TripNotFound,
});

function RouteComponent() {
  const { tripId } = Route.useParams();
  const trip = useTrip({ tripId });

  if (!trip) {
    return <TripNotFound />;
  }

  const revision = getCurrentItineraryRevision(trip.itineraryRevisions);
  const days = revision?.content.days;
  const dateRange = days
    ? formatItineraryDateRange(days.map((day) => day.date))
    : undefined;
  const isConfirmed = (revision?.status ?? trip.status) === 'confirmed';

  return (
    <div className="min-h-svh bg-background">
      <AnonymousUserBanner />

      <main className="box pb-16 pt-6 sm:pb-20 sm:pt-10">
        <LinkButton
          to="/t/trips"
          search={{ status: 'all' }}
          variant="ghost"
          size="sm"
          className="-ml-3 mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden="true" weight="bold" />
          All trips
        </LinkButton>

        <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span
                aria-hidden="true"
                className={
                  isConfirmed
                    ? 'size-1.5 rounded-full bg-primary'
                    : 'size-1.5 rounded-full bg-destructive'
                }
              />
              {isConfirmed ? 'Confirmed itinerary' : 'Draft itinerary'}
            </p>
            <h1 className="mt-3 text-balance text-3xl font-normal tracking-[-0.025em] text-foreground sm:text-4xl">
              {trip.title}
            </h1>
            {days ? (
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <CalendarBlankIcon aria-hidden="true" className="size-4" />
                {dateRange ? <span>{dateRange}</span> : null}
                {dateRange ? <span aria-hidden="true">·</span> : null}
                <span>
                  {days.length === 1 ? '1 day' : `${days.length} days`}
                </span>
              </p>
            ) : null}
          </div>
          {revision ? (
            <div className="shrink-0 self-start sm:self-auto">
              <LinkButton to="/t/$tripId/chat" params={{ tripId }} size="lg">
                Continue refining
              </LinkButton>
            </div>
          ) : null}
        </header>

        {days ? (
          <div className="divide-y divide-border">
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
      </main>
    </div>
  );
}

function TripNotFound() {
  return (
    <main className="box flex min-h-svh flex-col items-center justify-center py-16 text-center">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Trip not found</EmptyTitle>
          <EmptyDescription className="text-balance">
            This trip may have been removed, or it may belong to another
            account.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <LinkButton to="/t/trips" search={{ status: 'all' }}>
            Back to your trips
          </LinkButton>
        </EmptyContent>
      </Empty>
    </main>
  );
}
