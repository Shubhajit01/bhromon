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
import { seo } from '#/lib/seo';

export const Route = createFileRoute('/_p/t/$tripId/chat')({
  component: Trip,
  async loader({ params, context }) {
    const [trip] = await Promise.all([
      loadTrip(context.queryClient, { tripId: params.tripId }),
      loadTripMessages(context.queryClient, { tripId: params.tripId }),
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
    <div className="flex h-dvh min-h-0 flex-col">
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
    <header className="box flex items-center gap-3 py-4 border-b border-muted lg:border-0 lg:gap-0">
      <Button
        size="icon-lg"
        variant="outline"
        className="lg:-ml-10 lg:-translate-x-2/4"
        aria-label="Back"
        onPress={() =>
          can
            ? router.history.back()
            : navigate({ to: '/t/$tripId', params: { tripId } })
        }
      >
        <ArrowLeftIcon weight="bold" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium tracking-tight">
          {trip.title}
        </p>
        <p className="text-sm text-muted-foreground -mt-1">
          Chat and decide your itinerary
        </p>
      </div>
    </header>
  );
}
