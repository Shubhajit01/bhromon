import {
  createFileRoute,
  useCanGoBack,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';

import { ArrowLeftIcon } from '@phosphor-icons/react';

import { Button } from '#/components/ui/button';
import { AnonymousUserBanner } from '#/features/auth/components/anonymous-user-banner';
import { loadTrip, useTrip } from '#/features/trip/api/get-trip';
import { loadTripMessages } from '#/features/trip-chat/api/get-trip-messages';
import { TripChat } from '#/features/trip-chat/components/trip-chat';

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
    <div className="flex h-dvh min-h-0 flex-col gap-2">
      <AnonymousUserBanner />
      <TripHeader tripId={tripId} />
      <main className="grid min-h-0 grow">
        <TripChat tripId={tripId} />
      </main>
    </div>
  );
}

function TripHeader({ tripId }: { tripId: string }) {
  const trip = useTrip({ tripId });

  const can = useCanGoBack();
  const router = useRouter();
  const navigate = useNavigate();

  return (
    <header className="box grid grid-cols-[auto_minmax(0,1fr)_auto] items-center py-4">
      <Button
        size="icon-lg"
        variant="outline"
        className="-ml-10 -translate-x-full"
        aria-label="Back"
        onPress={() =>
          can
            ? router.history.back()
            : navigate({ to: '/t/$tripId', params: { tripId } })
        }
      >
        <ArrowLeftIcon weight="bold" />
      </Button>

      <div className="min-w-0">
        <p className="truncate text-base font-medium tracking-tight">
          {trip.title}
        </p>
        <p className="text-sm text-muted-foreground -mt-1">
          Chat and decide your itinerary
        </p>
      </div>
      <span aria-hidden="true" />
    </header>
  );
}
