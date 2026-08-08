import { createFileRoute } from '@tanstack/react-router';

import type { ErrorComponentProps } from '@tanstack/react-router';

import { EmptyIcon } from '@phosphor-icons/react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty';
import { loadTrip } from '#/features/trip/api/get-trip';

export const Route = createFileRoute('/_p/t/$tripId')({
  async loader({ params, context }) {
    void loadTrip(context.queryClient, { tripId: params.tripId });
  },
  errorComponent: function ErrorComponent({ error }: ErrorComponentProps) {
    return (
      <main className="w-screen h-dvh grid place-items-center">
        <Empty className="border border-dashed max-w-md">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="text-destructive">
              <EmptyIcon />
            </EmptyMedia>
            <EmptyTitle>{error.message}</EmptyTitle>
            <EmptyDescription>
              The trip you're looking for doesn't exist.
            </EmptyDescription>
          </EmptyHeader>{' '}
        </Empty>
      </main>
    );
  },
});
