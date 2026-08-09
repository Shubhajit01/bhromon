import type { ComponentProps } from 'react';

import { cn } from '#/lib/utils';

import { LinkButton } from './ui/button';

interface PageProps extends ComponentProps<'div'> {
  isScrollable?: boolean;
}

function PageRoot({ className, isScrollable = true, ...props }: PageProps) {
  return (
    <div
      data-slot="page"
      data-scrollable={isScrollable}
      className={cn(
        'flex h-dvh w-screen flex-col overflow-x-hidden',
        isScrollable ? 'overflow-y-auto' : 'overflow-y-hidden',
        className,
      )}
      {...props}
    />
  );
}

interface PageHeaderProps extends ComponentProps<'header'> {
  isSticky?: boolean;
}

function PageHeader({
  children,
  className,
  isSticky = true,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      data-sticky={isSticky}
      className={cn(
        'z-10 grow-0 shrink-0 border-b border-border/40 bg-background/75 backdrop-blur-xs',
        isSticky && 'sticky top-0',
        className,
      )}
      {...props}
    >
      <div className="box flex min-h-12 items-center gap-4 py-3">
        {children}
      </div>
    </header>
  );
}

function PageBrand({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-brand"
      className={cn(
        'flex shrink-0 items-center uppercase text-sm font-semibold gap-1',
        className,
      )}
      {...props}
    />
  );
}

function PageActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <nav
      data-slot="page-actions"
      className={cn('ml-auto flex items-center gap-3.5', className)}
      {...props}
    />
  );
}

function PageActionLink({
  className,
  ...props
}: ComponentProps<typeof LinkButton>) {
  return (
    <LinkButton
      variant="link"
      data-slot="page-action-link"
      className={cn('px-0 text-foreground', className)}
      {...props}
    />
  );
}

function PageMain({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      data-slot="page-main"
      className={cn('min-h-0 grow', className)}
      {...props}
    />
  );
}

const Page = Object.assign(PageRoot, {
  ActionLink: PageActionLink,
  Actions: PageActions,
  Brand: PageBrand,
  Header: PageHeader,
  Main: PageMain,
});

export { Page };
