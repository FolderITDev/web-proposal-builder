import Link from 'next/link';

import { siteConfig } from '@/config/site';

/** Product name set like a dial signature, with the maker below. */
export function Wordmark() {
  return (
    <div className="flex items-center gap-3.5">
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
        <circle cx="12" cy="12" r="11" fill="none" stroke="var(--color-ink)" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="7.5" fill="none" stroke="var(--color-steel)" strokeWidth="0.6" />
        <path
          d="M12 12 L12 4.5"
          stroke="var(--color-ink)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M12 12 L17 15"
          stroke="var(--color-brass)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="1.4" fill="var(--color-ink)" />
      </svg>
      <div className="flex flex-col">
        <Link
          href="/"
          className="serif text-[1.1875rem] leading-none font-[450] tracking-[-0.01em] whitespace-nowrap"
        >
          {siteConfig.name}
        </Link>
        <span className="mt-1 hidden text-[0.75rem] leading-none text-ink-3 sm:block">
          Commercial proposals by{' '}
          <a
            href={siteConfig.company.url}
            className="underline decoration-steel underline-offset-2 hover:text-ink"
          >
            {siteConfig.company.name}
          </a>
        </span>
      </div>
    </div>
  );
}
