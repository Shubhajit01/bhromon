import type { AnyRouteMatch } from '@tanstack/react-router';

type PreloadLinkItem = NonNullable<AnyRouteMatch['links']>[number];

export function preloadImageAsLink(
  type: string,
  href: string,
): PreloadLinkItem {
  return {
    rel: 'preload',
    href: href,
    as: 'image',
    type: type,
  };
}

export function preloadImage(src: string): void {
  if (import.meta.env.SSR) return;
  const image = new Image();
  image.src = src;
}

export function preloadFontAsLink(href: string): PreloadLinkItem {
  return {
    rel: 'preload',
    as: 'font',
    crossOrigin: 'anonymous',
    href: href,
  };
}
