import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';

import type { QueryClient } from '@tanstack/react-query';

import { logoOnDarkUrl, logoUrl } from '#/components/logo';
import { site } from '#/config/site';
import { loadCurrentUser } from '#/features/auth/api/get-current-user';
import { preloadFont } from '#/lib/helpers';

import fontsCss from '../styles/fonts.css?url';
import appCss from '../styles/globals.css?url';
import geistFontUrl from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import merriweatherFontUrl from '@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2?url';

interface RootContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootContext>()({
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
      preloadFont(geistFontUrl),
      preloadFont(merriweatherFontUrl),

      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: fontsCss },
    ],
  }),
  async beforeLoad({ context }) {
    await loadCurrentUser(context.queryClient);
  },
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <ReactQueryDevtools />
        <Scripts />
      </body>
    </html>
  );
}
