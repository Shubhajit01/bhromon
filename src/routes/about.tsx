import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { loadUserLimits } from '#/features/auth/api/get-user-limits';
import { LandingPage } from '#/features/site/components/landing-page';
import { SiteDialog } from '#/features/site/components/site-dialog';
import { preloadImageAsLink } from '#/lib/helpers';
import { seo } from '#/lib/seo';

import himalayanValleyAvif from '#/assets/images/himalayan-valley.png?format=avif&enhanced';
import himalayanValleyWebp from '#/assets/images/himalayan-valley.png?format=webp&enhanced';

export const Route = createFileRoute('/about')({
  component: AboutRoute,
  loader: ({ context }) => loadUserLimits(context.queryClient),
  head: () => ({
    meta: seo({
      title: 'About',
      description:
        'Learn why Bhromon puts personal, self-guided travel planning before packages and bookings.',
    }),
    links: [
      preloadImageAsLink('image/webp', himalayanValleyWebp),
      preloadImageAsLink('image/avif', himalayanValleyAvif),
    ],
  }),
});

function AboutRoute() {
  const navigate = useNavigate({ from: '/about' });

  return (
    <>
      <LandingPage />
      <SiteDialog
        kind="about"
        onClose={() => void navigate({ to: '/', replace: true })}
      />
    </>
  );
}
