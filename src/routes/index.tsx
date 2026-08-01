import { createFileRoute } from '@tanstack/react-router';

import { Logo } from '#/components/logo';
import { TripPromptComposer } from '#/features/trip-planning/components/trip-prompt-composer';
import { preloadImage } from '#/lib/helpers';
import { seo } from '#/lib/seo';

import himalayanValleyAvif from '#/assets/images/himalayan-valley.png?format=avif&enhanced';
import himalayanValleyWebp from '#/assets/images/himalayan-valley.png?format=webp&enhanced';
import himalayanValleyFallback from '#/assets/images/himalayan-valley.png?format=webp&w=20&inline&enhanced';

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: seo(),
    links: [
      preloadImage('image/webp', himalayanValleyWebp),
      preloadImage('image/avif', himalayanValleyAvif),
    ],
  }),
});

function Home() {
  return (
    <main>
      <section
        className="grid min-h-svh overflow-hidden *:[grid-area:stack] group bg-no-repeat bg-cover bg-bottom"
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
            className="size-full relative object-cover object-bottom"
          />
        </picture>

        <div
          aria-hidden="true"
          className="backdrop-blur-sm opacity-0 transition-opacity duration-500 group-focus-within:opacity-100"
        />

        <div aria-hidden="true" className="relative bg-slate-900/70" />

        <div className="relative flex flex-col gap-6 items-center justify-center px-6">
          <Logo variant="dark" />

          <h1 className="max-w-5xl font-fancy text-background font-thin text-balance text-5xl text-center leading-tight">
            Every journey should feel{' '}
            <span className="bg-primary px-2 inline-block">like yours</span>
          </h1>

          <div className="mt-1 w-full max-w-3xl">
            <TripPromptComposer />
          </div>

          <p className="max-w-xl text-balance leading-tight text-center text-base text-background/70">
            Tell us where you want to go, how you like to travel, and what would
            make the journey unforgettable.
          </p>
        </div>
      </section>
    </main>
  );
}
