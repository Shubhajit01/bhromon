import { Link, useRouter } from '@tanstack/react-router';

import {
  EnvelopeSimpleIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
} from '@phosphor-icons/react';

import type { Icon } from '@phosphor-icons/react';

import { buttonVariants } from '#/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { cn } from '#/lib/utils';

export type SiteDialogKind = 'about' | 'contact';

interface SiteDialogProps {
  kind: SiteDialogKind;
  onClose?: () => void;
}

interface SiteDialogLinkProps {
  kind: SiteDialogKind;
  className?: string;
}

interface ExternalLinkProps {
  href: string;
  icon: Icon;
  label: string;
  opensInNewTab?: boolean;
}

const linkedInUrl = 'https://www.linkedin.com/in/shubhajit-chatterjee';
const githubUrl = 'https://github.com/Shubhajit01/bhromon';
const emailUrl = 'mailto:chatterjee.shubhajit01@gmail.com';

function SiteDialogLink({ kind, className }: SiteDialogLinkProps) {
  const label = kind === 'about' ? 'About' : 'Contact';

  return (
    <Link
      to="."
      search={(previous) => ({ ...previous, overlay: kind })}
      mask={{ to: `/${kind}`, unmaskOnReload: true }}
      className={className}
    >
      {label}
    </Link>
  );
}

function SiteDialog({ kind, onClose }: SiteDialogProps) {
  const router = useRouter();

  return (
    <Dialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          if (onClose) {
            onClose();
          } else {
            router.history.back();
          }
        }
      }}
      className={cn(
        'max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-y-auto rounded-2xl p-6 sm:max-h-[calc(100dvh-3rem)] sm:p-8',
        kind === 'about' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
      )}
    >
      {kind === 'about' ? <AboutContent /> : <ContactContent />}
    </Dialog>
  );
}

function AboutContent() {
  return (
    <>
      <DialogHeader className="gap-2 pr-10">
        <DialogTitle className="text-balance text-2xl leading-tight font-normal tracking-tight sm:text-3xl">
          A journey that feels like yours
        </DialogTitle>
        <DialogDescription className="text-pretty text-base leading-6">
          Bhromon (<span lang="bn">ভ্রমণ</span>) means travel or journey in
          Bengali. It helps you shape a self-guided trip around your interests,
          pace, constraints, and sense of discovery.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-6 text-base leading-7 text-foreground">
        <section className="flex flex-col gap-2">
          <h3 className="text-xl font-medium tracking-tight">
            Planning without the package tour
          </h3>
          <p className="text-pretty">
            Many travel products begin with rigid forms, inventory, and
            packages—or add a chatbot to the same booking funnel. Bhromon begins
            with what you want the journey to feel like. It helps you develop
            and manage the plan without trying to sell you the trip.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-xl font-medium tracking-tight">
            What Bhromon is becoming
          </h3>
          <p className="text-pretty">
            Bhromon is under active development. Today, you can describe a trip
            naturally, refine the itinerary through conversation, and review it
            before saving. The longer-term direction includes respectful,
            destination-specific cultural context and relevant legal guidance
            without making assumptions about who you are.
          </p>
          <p className="text-pretty text-sm leading-6 text-muted-foreground">
            Legal context will be sourced from publicly available online
            information, is informational only, and may change. Verify important
            requirements with current official sources or a qualified
            professional.
          </p>
        </section>

        <section className="flex flex-col gap-2 border-t pt-6">
          <h3 className="text-xl font-medium tracking-tight">
            Made by Shubhajit Chatterjee
          </h3>
          <p className="text-pretty">
            I built Bhromon because planning your own journey should feel
            personal and manageable, not crowded or expensive. I want travellers
            to remain in control while still having thoughtful guidance when it
            matters.
          </p>
          <div className="mt-2 flex gap-2" aria-label="Creator links">
            <ExternalLink
              href={linkedInUrl}
              icon={LinkedinLogoIcon}
              label="Shubhajit Chatterjee on LinkedIn"
              opensInNewTab
            />
            <ExternalLink
              href={githubUrl}
              icon={GithubLogoIcon}
              label="Explore Bhromon's code on GitHub"
              opensInNewTab
            />
          </div>
        </section>
      </div>
    </>
  );
}

function ContactContent() {
  return (
    <>
      <DialogHeader className="gap-3 pr-10">
        <DialogTitle className="text-balance text-2xl leading-tight font-normal tracking-tight sm:text-3xl">
          Have a thought about Bhromon?
        </DialogTitle>
        <DialogDescription className="text-pretty text-base leading-7 text-foreground">
          I’d be glad to hear product feedback, discuss a collaboration, or talk
          about professional opportunities. Choose whichever way of getting in
          touch works for you.
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-2" aria-label="Contact links">
        <ExternalLink
          href={emailUrl}
          icon={EnvelopeSimpleIcon}
          label="Email Shubhajit Chatterjee"
        />
        <ExternalLink
          href={linkedInUrl}
          icon={LinkedinLogoIcon}
          label="Shubhajit Chatterjee on LinkedIn"
          opensInNewTab
        />
        <ExternalLink
          href={githubUrl}
          icon={GithubLogoIcon}
          label="Explore Bhromon's code on GitHub"
          opensInNewTab
        />
      </div>
    </>
  );
}

function ExternalLink({
  href,
  icon: LinkIcon,
  label,
  opensInNewTab = false,
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={opensInNewTab ? '_blank' : undefined}
      rel={opensInNewTab ? 'noreferrer' : undefined}
      className={buttonVariants({ variant: 'secondary', size: 'icon-lg' })}
    >
      <LinkIcon aria-hidden="true" weight="fill" />
    </a>
  );
}

export { SiteDialog, SiteDialogLink };
