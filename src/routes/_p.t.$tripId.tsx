import { createFileRoute } from '@tanstack/react-router';

import type { ErrorComponentProps } from '@tanstack/react-router';

import { EmptyIcon } from '@phosphor-icons/react';

import { Page } from '#/components/page';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty';
import { loadTrip } from '#/features/trip/api/get-trip';
import { createLogger, elapsedMilliseconds } from '#/lib/logger';

const logger = createLogger('trip-route');

export const Route = createFileRoute('/_p/t/$tripId')({
  async loader({ params, context }) {
    const startedAt = performance.now();
    logger.info('trip_route.loader_started', { tripId: params.tripId });
    const tripPromise = loadTrip(context.queryClient, {
      tripId: params.tripId,
    });

    void tripPromise.then(
      () => {
        logger.info('trip_route.trip_load_completed', {
          durationMs: elapsedMilliseconds(startedAt),
          tripId: params.tripId,
        });
      },
      (error: unknown) => {
        logger.error('trip_route.trip_load_failed', error, {
          durationMs: elapsedMilliseconds(startedAt),
          tripId: params.tripId,
        });
      },
    );

    logger.info('trip_route.loader_returned', {
      durationMs: elapsedMilliseconds(startedAt),
      tripId: params.tripId,
      tripLoadPending: true,
    });
  },
  errorComponent: function ErrorComponent({ error }: ErrorComponentProps) {
    return (
      <Page>
        <Page.Main className="grid place-items-center p-6">
          <Empty className="border border-dashed max-w-md">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="text-destructive">
                <EmptyIcon />
              </EmptyMedia>
              <EmptyTitle>{error.message}</EmptyTitle>
              <EmptyDescription>
                The trip you're looking for doesn't exist.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Page.Main>
      </Page>
    );
  },
});
