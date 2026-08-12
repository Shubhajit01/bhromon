import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';

import type { QueryClient } from '@tanstack/react-query';

import { EnvelopeSimpleIcon, LinkedinLogoIcon } from '@phosphor-icons/react';
import { z } from 'zod';

import { logoOnDarkUrl, logoUrl } from '#/components/logo';
import NavigationProgress from '#/components/navigation-progress';
import { Page } from '#/components/page';
import { buttonVariants } from '#/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty';
import { site } from '#/config/site';
import { loadCurrentUser } from '#/features/auth/api/get-current-user';
import { SiteDialog } from '#/features/site/components/site-dialog';
import { preloadFontAsLink } from '#/lib/helpers';

import fontsCss from '../styles/fonts.css?url';
import appCss from '../styles/globals.css?url';
import geistFontUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import merriweatherFontUrl from '@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2?url';

interface RootContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootContext>()({
  validateSearch: z.object({
    overlay: z.enum(['about', 'contact']).optional().catch(undefined),
  }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: site.name },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: logoUrl,
        media: '(prefers-color-scheme: light)',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: logoOnDarkUrl,
        media: '(prefers-color-scheme: dark)',
      },
      preloadFontAsLink(geistFontUrl),
      preloadFontAsLink(merriweatherFontUrl),

      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: fontsCss },
    ],
    scripts: import.meta.env.DEV
      ? [{ src: '//unpkg.com/react-scan/dist/auto.global.js' }]
      : [],
  }),
  async beforeLoad({ context }) {
    await loadCurrentUser(context.queryClient);
  },
  errorComponent: GlobalError,
  shellComponent: RootDocument,
});

function GlobalError() {
  return (
    <Page>
      <Page.Main className="grid place-items-center p-6">
        <Empty className="max-w-md border" role="alert">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="text-destructive">
              <EnvelopeSimpleIcon weight="duotone" />
            </EmptyMedia>
            <EmptyTitle>Something went wrong</EmptyTitle>
            <EmptyDescription>
              Bhromon ran into an unexpected problem. Please get in touch if you
              need help.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <a
              href="mailto:chatterjee.shubhajit01@gmail.com"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              <EnvelopeSimpleIcon aria-hidden="true" weight="fill" />
              Email
            </a>
            <a
              href="https://www.linkedin.com/in/shubhajit-chatterjee"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              <LinkedinLogoIcon aria-hidden="true" weight="fill" />
              LinkedIn
            </a>
          </EmptyContent>
        </Empty>
      </Page.Main>
    </Page>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const overlay = Route.useSearch({ select: (search) => search.overlay });

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        {overlay ? <SiteDialog kind={overlay} /> : null}
        <NavigationProgress />
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
