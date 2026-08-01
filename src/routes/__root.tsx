import { TanStackDevtools } from '@tanstack/react-devtools';
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import { logoOnDarkUrl, logoUrl } from '#/components/logo';
import { site } from '#/config/site';
import { preloadFont } from '#/lib/helpers';

import fontsCss from '../styles/fonts.css?url';
import appCss from '../styles/globals.css?url';
// import merriweatherFontUrl from '@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2?url';
import ibmFontUrl from '@fontsource/ibm-plex-serif/files/ibm-plex-serif-latin-400-normal.woff2?url';
import interFontUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';

export const Route = createRootRoute({
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
      preloadFont(interFontUrl),
      preloadFont(ibmFontUrl),

      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: fontsCss },
    ],
  }),
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
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
