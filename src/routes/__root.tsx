import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import appCss from '../styles/globals.css?url';
import fontsCss from '../styles/fonts.css?url';

import interFontUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import merriweatherFontUrl from '@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start Starter' },
    ],
    links: [
      {
        rel: 'preload',
        as: 'font',
        crossOrigin: 'anonymous',
        href: interFontUrl,
      },
      {
        rel: 'preload',
        as: 'font',
        crossOrigin: 'anonymous',
        href: merriweatherFontUrl,
      },
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
