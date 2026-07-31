import type { AnyRouteMatch } from '@tanstack/react-router';

type PreloadLinkItem = NonNullable<AnyRouteMatch['links']>[number];

export function preloadImage(type: string, href: string): PreloadLinkItem {
  return {
    rel: 'preload',
    href: href,
    as: 'image',
    type: type,
  };
}

export function preloadFont(href: string): PreloadLinkItem {
  return {
    rel: 'preload',
    as: 'font',
    crossOrigin: 'anonymous',
    href: href,
  };
}
