import { createFileRoute } from '@tanstack/react-router';

import { preloadImage } from '#/lib/helpers';
import { seo } from '#/lib/seo';

import forestBgAvif from '#/assets/images/forest-bg.jpg?format=avif&aspect=3:1&fit=cover&position=top&enhanced';
import forestBgWebp from '#/assets/images/forest-bg.jpg?format=webp&aspect=3:1&fit=cover&position=top&enhanced';

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: seo(),
    links: [
      preloadImage('image/webp', forestBgWebp),
      preloadImage('image/avif', forestBgAvif),
    ],
  }),
});

function Home() {
  return (
    <div>
      <main>
        <section>
          <div className="relative max-h-[60dvh] h-dvh w-full bg-no-repeat bg-cover bg-top">
            <picture>
              <source srcSet={forestBgAvif} />
              <img
                src={forestBgWebp}
                fetchPriority="high"
                className="max-h-[60vh] size-full absolute inset-0 object-cover object-top"
              />
            </picture>
            <div className="bg-linear-to-t from-background to-background/0 absolute inset-0 size-full self-end" />
          </div>
        </section>
      </main>
    </div>
  );
}
