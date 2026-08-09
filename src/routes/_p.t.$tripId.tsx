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

export const Route = createFileRoute('/_p/t/$tripId')({
  async loader({ params, context }) {
    void loadTrip(context.queryClient, { tripId: params.tripId });
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
