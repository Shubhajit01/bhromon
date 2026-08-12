import { Link } from '@tanstack/react-router';

import { Logo } from '#/components/logo';
import { useMaybeCurrentUser } from '#/features/auth/api/get-current-user';
import { ScreenTour } from '#/features/product-tour/components/screen-tour';
import { TripPromptComposer } from '#/features/trip/components/trip-prompt-composer';
import { cn } from '#/lib/utils';

import { SiteDialogLink } from './site-dialog';

import himalayanValleyAvif from '#/assets/images/himalayan-valley.png?format=avif&enhanced';
import himalayanValleyWebp from '#/assets/images/himalayan-valley.png?format=webp&enhanced';
import himalayanValleyFallback from '#/assets/images/himalayan-valley.png?format=webp&w=20&inline&enhanced';

const dockLinkClassName = cn(
  '-ml-px flex h-10 min-w-24 items-center justify-center rounded-none border border-white/20 bg-slate-950/55 px-5 text-sm font-medium text-white first:ml-0',
  'transition-[background-color,border-color,opacity,transform] duration-150 hover:border-white/35 hover:bg-slate-950/75 active:translate-y-px',
  'outline-none focus-visible:border-white/70 focus-visible:ring-3 focus-visible:ring-white/25',
);

function LandingPage() {
  const user = useMaybeCurrentUser();

  return (
    <main>
      <section
        data-landing-page
        className="group grid min-h-svh overflow-hidden bg-cover bg-bottom bg-no-repeat *:[grid-area:stack]"
        style={{
          gridTemplateAreas: '"stack"',
          backgroundImage: `url("${himalayanValleyFallback}")`,
        }}
      >
        <div aria-hidden="true" className="backdrop-blur" />

        <picture>
          <source srcSet={himalayanValleyAvif} type="image/avif" />
          <source srcSet={himalayanValleyWebp} type="image/webp" />
          <img
            src={himalayanValleyWebp}
            alt=""
            fetchPriority="high"
            className="relative size-full object-cover object-bottom select-none"
          />
        </picture>

        <div
          aria-hidden="true"
          className="backdrop-blur-sm opacity-0 transition-opacity duration-500 group-focus-within:opacity-100"
        />

        <div aria-hidden="true" className="relative bg-slate-900/70" />

        <div className="relative flex flex-col items-center justify-center gap-6 px-6 py-24">
          <Logo variant="dark" />

          <h1 className="max-w-5xl text-balance text-center font-fancy text-5xl leading-tight font-thin text-background">
            Every journey should feel{' '}
            <span className="inline-block bg-foreground px-2 text-background">
              like yours
            </span>
          </h1>

          <div data-tour="home-trip-prompt" className="mt-1 w-full max-w-3xl">
            <TripPromptComposer />
          </div>

          <p className="max-w-xl text-balance text-center text-base leading-tight text-background/70">
            Tell us where you want to go, how you like to travel, and what would
            make the journey unforgettable.
          </p>
        </div>

        <nav
          aria-label="Bhromon"
          data-landing-dock
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 transition-opacity duration-150 sm:bottom-6"
        >
          {user ? (
            <Link to="/t/trips" className={dockLinkClassName}>
              Trips
            </Link>
          ) : null}
          <SiteDialogLink kind="about" className={dockLinkClassName} />
          <SiteDialogLink kind="contact" className={dockLinkClassName} />
        </nav>

        <ScreenTour
          id="home"
          steps={[
            {
              target: '[data-tour="home-trip-prompt"]',
              title: 'Begin with your idea',
              content:
                'Share where you want to go, when you might travel, and what would make the journey feel like yours.',
            },
          ]}
        />
      </section>
    </main>
  );
}

export { LandingPage };
