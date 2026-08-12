import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { loadUserLimits } from '#/features/auth/api/get-user-limits';
import { LandingPage } from '#/features/site/components/landing-page';
import { SiteDialog } from '#/features/site/components/site-dialog';
import { preloadImageAsLink } from '#/lib/helpers';
import { seo } from '#/lib/seo';

import himalayanValleyAvif from '#/assets/images/himalayan-valley.png?format=avif&enhanced';
import himalayanValleyWebp from '#/assets/images/himalayan-valley.png?format=webp&enhanced';

export const Route = createFileRoute('/contact')({
  component: ContactRoute,
  loader: ({ context }) => loadUserLimits(context.queryClient),
  head: () => ({
    meta: seo({
      title: 'Contact',
      description:
        'Share product feedback, discuss a collaboration, or connect with the creator of Bhromon.',
    }),
    links: [
      preloadImageAsLink('image/webp', himalayanValleyWebp),
      preloadImageAsLink('image/avif', himalayanValleyAvif),
    ],
  }),
});

function ContactRoute() {
  const navigate = useNavigate({ from: '/contact' });

  return (
    <>
      <LandingPage />
      <SiteDialog
        kind="contact"
        onClose={() => void navigate({ to: '/', replace: true })}
      />
    </>
  );
}
