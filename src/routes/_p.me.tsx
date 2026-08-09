import { createFileRoute } from '@tanstack/react-router';

import { Logo } from '#/components/logo';
import { Page } from '#/components/page';
import { CurrentUserAvatar } from '#/features/auth/components/current-user-avatar';

export const Route = createFileRoute('/_p/me')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Page>
      <Page.Header>
        <Page.Brand>
          <Logo variant="light" size={32} />
        </Page.Brand>

        <Page.Actions>
          <Page.ActionLink to="/t/trips">My Trips</Page.ActionLink>
          <CurrentUserAvatar />
        </Page.Actions>
      </Page.Header>

      <Page.Main className="box py-8">Hello "/_p/me"!</Page.Main>
    </Page>
  );
}
