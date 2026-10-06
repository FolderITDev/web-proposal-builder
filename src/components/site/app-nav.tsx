'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

const ITEMS = [
  {
    href: '/proposals',
    label: 'Proposals',
    match: (path: string) => path.startsWith('/proposals'),
  },
  { href: '/docs/api', label: 'API', match: (path: string) => path.startsWith('/docs') },
] as const;

/** Navigation for the tool; marks the current section for sighted and screen-reader users. */
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Application">
      <ul className="flex items-center sm:gap-1">
        {ITEMS.map((item) => {
          const current = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'relative rounded-sm px-2 py-2 text-sm transition-colors duration-150 sm:px-3 sm:text-[0.9375rem]',
                  current
                    ? 'font-[600] text-ink after:absolute after:inset-x-2 after:-bottom-[1.05rem] after:h-0.5 after:bg-brass sm:after:inset-x-3'
                    : 'text-ink-2 hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
