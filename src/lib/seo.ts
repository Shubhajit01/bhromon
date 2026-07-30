import type { AnyRouteMatch } from '@tanstack/react-router';

import { site } from '#/config/site';

type MultiSingleValue = string | Array<string>;

interface SeoOptions {
  title?: MultiSingleValue;
  keywords?: MultiSingleValue;
  description?: string;
}

type SeoReturn = AnyRouteMatch['meta'];

export function seo(options?: SeoOptions): SeoReturn {
  const title = buildTitle(options?.title);

  if (!options) {
    return [{ title }];
  }

  const meta: SeoReturn = [
    { title },
    { property: 'og:title', content: title },
    { property: 'og:site_name', content: site.name },
  ];

  if (options.description) {
    meta.push(
      { name: 'description', content: options.description },
      { property: 'og:description', content: options.description },
    );
  }

  const keywords = toList(options.keywords).join(', ');

  if (keywords) {
    meta.push({ name: 'keywords', content: keywords });
  }

  return meta;
}

function toList(value: MultiSingleValue | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function buildTitle(title: MultiSingleValue | undefined) {
  const parts = toList(title).filter((part) => part && part !== site.name);
  parts.push(site.name);

  return parts.join(' | ');
}
