import { createFileRoute, notFound } from '@tanstack/react-router';

import { ArrowLeftIcon } from '@phosphor-icons/react';

import { LinkButton } from '#/components/ui/button';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
import { loadTrip, useTrip } from '#/features/trip/api/get-trip';
import { TripOverview } from '#/features/trip/components/trip-overview';
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

        <TripOverview
          trip={trip}
          chatAction={
            <LinkButton to="/t/$tripId/chat" params={{ tripId }} size="lg">
              {trip.itineraryRevisions.some(
                (revision) =>
                  revision.status === 'draft' ||
                  revision.status === 'confirmed',
              )
                ? 'Continue refining'
                : 'Plan this trip'}
            </LinkButton>
          }
        />
      </main>
    </div>
  );
}

function TripNotFound() {
  return (
    <main className="box flex min-h-svh flex-col items-center justify-center py-16 text-center">
      <h1 className="text-2xl font-medium tracking-tight">Trip not found</h1>
      <p className="mt-2 max-w-sm text-pretty text-muted-foreground">
        This trip may have been removed, or it may belong to another account.
      </p>
      <LinkButton to="/t/trips" search={{ status: 'all' }} className="mt-6">
        Back to your trips
      </LinkButton>
    </main>
  );
}
