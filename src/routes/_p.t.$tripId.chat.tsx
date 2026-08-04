import {
  createFileRoute,
  useCanGoBack,
  useNavigate,
} from '@tanstack/react-router';

import { ArrowLeftIcon } from '@phosphor-icons/react';

import { Button } from '#/components/ui/button';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
import { loadTrip, useTrip } from '#/features/trip/api/get-trip';
import { loadTripMessages } from '#/features/trip/api/get-trip-messages';
import { TripChat } from '#/features/trip/components/trip-chat';

export const Route = createFileRoute('/_p/t/$tripId/chat')({
  component: Trip,
  async loader({ params, context }) {
    await Promise.all([
      loadTrip(context.queryClient, { tripId: params.tripId }),
      loadTripMessages(context.queryClient, { tripId: params.tripId }),
    ]);
  },
});

function Trip() {
  const { tripId } = Route.useParams();

  return (
    <div className="h-dvh flex flex-col gap-2">
      <AnonymousUserBanner />
      <TripHeader tripId={tripId} />
      <main className="box grid grow pt-4">
        <TripChat tripId={tripId} />
      </main>
    </div>
  );
}

function TripHeader({ tripId }: { tripId: string }) {
  const trip = useTrip({ tripId });

  const can = useCanGoBack();
  const navigate = useNavigate();

  return (
    <header className="py-4 relative box flex items-center">
      <Button
        size="icon-sm"
        variant="outline"
        className="-ml-8 -translate-x-full"
        onPress={() =>
          can
            ? window.history.back()
            : navigate({ to: '/t/$tripId', params: { tripId } })
        }
      >
        <ArrowLeftIcon weight="bold" />
      </Button>

      <div>
        <p className="text-base font-medium tracking-tight">{trip.title}</p>
        <p className="text-sm text-muted-foreground -mt-1">
          Chat and decide your itinerary
        </p>
      </div>
      <div />
    </header>
  );
}
