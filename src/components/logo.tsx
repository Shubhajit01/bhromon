import type { ComponentPropsWithoutRef } from 'react';

import logoSvg from '#/assets/logo.svg';
import logoOnDarkSvg from '#/assets/logo-on-dark.svg';
import { cn } from '#/lib/utils';

export const logoUrl = logoSvg;
export const logoOnDarkUrl = logoOnDarkSvg;

export type LogoVariant = 'light' | 'dark' | 'system';

export interface LogoProps extends Omit<
  ComponentPropsWithoutRef<'img'>,
  'height' | 'src' | 'width'
> {
  size?: ComponentPropsWithoutRef<'img'>['width'];
  variant?: LogoVariant;
}

export function Logo({
  variant = 'system',
  size = 40,
  alt = 'Bhromon',
  className: classNameProp,
  ...props
}: LogoProps) {
  const className = cn('select-none', classNameProp);

  if (variant === 'system') {
    return (
      <picture>
        <source media="(prefers-color-scheme: dark)" srcSet={logoOnDarkUrl} />
        <img
          src={logoUrl}
          alt={alt}
          width={size}
          height={size}
          {...props}
          className={className}
        />
      </picture>
    );
  }

  return (
    <img
      src={variant === 'dark' ? logoOnDarkUrl : logoUrl}
      alt={alt}
      width={size}
      height={size}
      {...props}
      className={className}
    />
  );
}
