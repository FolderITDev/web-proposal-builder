import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

import { Wordmark } from './wordmark';

const NAV = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#pricing-math', label: 'Pricing math' },
  { href: '/docs/api', label: 'API' },
] as const;

/** Public header for the landing and documentation pages. */
export function SiteHeader() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex h-20 max-w-[88rem] items-center justify-between gap-6 px-5 sm:px-8">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-sm px-3 py-2 text-[0.9375rem] text-ink-2 transition-colors duration-150 hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={siteConfig.repositoryUrl}
                className="rounded-sm px-3 py-2 text-[0.9375rem] text-ink-2 transition-colors duration-150 hover:text-ink"
              >
                GitHub
              </a>
            </li>
          </ul>
          <ButtonLink
            href="/proposals"
            variant="secondary"
            size="sm"
            className="ml-2 sm:h-11 sm:px-5 sm:text-[0.9375rem]"
          >
            <span className="sm:hidden">Open</span>
            <span className="hidden sm:inline">Open the builder</span>
            <ArrowRight aria-hidden />
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
