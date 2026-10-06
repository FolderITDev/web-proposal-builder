'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, Notice, Skeleton } from '@/components/ui/feedback';
import { Input, Select } from '@/components/ui/field';
import { formatMoney } from '@/domain/proposal/money';
import {
  isExpired,
  PROPOSAL_STATUSES,
  type ProposalStatus,
  STATUS_LABEL,
} from '@/domain/proposal/status';
import { cn } from '@/lib/cn';
import { formatDocumentDate, formatRelative } from '@/lib/proposal-format';
import { ListProposalsQuerySchema } from '@/lib/validation/proposal';

import { proposalsQuery, toSearchParams } from '../queries';
import { StatusBadge } from './status-badge';

const SEARCH_DEBOUNCE_MS = 300;

function RowsSkeleton() {
  return (
    <div aria-hidden className="flex flex-col">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-6 border-b border-rule py-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="hidden h-5 w-24 md:block" />
          <Skeleton className="h-5 w-28" />
        </div>
      ))}
    </div>
  );
}

/**
 * The proposals dashboard. Status, search, sort and page live in the URL so every view can be
 * shared and the back button behaves. Status tabs show counts across all visible proposals.
 */
export function ProposalList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = ListProposalsQuerySchema.safeParse(Object.fromEntries(searchParams));
  const query = parsed.success ? parsed.data : ListProposalsQuerySchema.parse({});
  const [search, setSearch] = useState(query.q ?? '');
  const [syncedQuery, setSyncedQuery] = useState(query.q);
  // Follow URL changes made elsewhere, such as a navigation link, without fighting the typing.
  if (query.q !== syncedQuery) {
    setSyncedQuery(query.q);
    if ((query.q ?? '') !== search.trim()) setSearch(query.q ?? '');
  }
  const result = useQuery(proposalsQuery(query));
  const today = new Date().toISOString().slice(0, 10);

  function update(changes: Partial<typeof query>) {
    const next = { ...query, page: 1, ...changes };
    router.replace(`${pathname}?${toSearchParams(next)}`, { scroll: false });
  }

  const applySearch = useEffectEvent((value: string) => {
    if (value !== (query.q ?? '')) update({ q: value || undefined });
  });

  useEffect(() => {
    const value = search.trim();
    const timer = setTimeout(() => applySearch(value), value ? SEARCH_DEBOUNCE_MS : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const data = result.data;
  const counts = data?.counts;
  const all = counts ? Object.values(counts).reduce((sum, value) => sum + value, 0) : undefined;
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const tabs: { value: ProposalStatus | undefined; label: string; count: number | undefined }[] = [
    { value: undefined, label: 'All', count: all },
    ...PROPOSAL_STATUSES.map((status) => ({
      value: status,
      label: STATUS_LABEL[status],
      count: counts?.[status],
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div
        role="group"
        aria-label="Filter by status"
        className="flex flex-wrap gap-x-1 gap-y-2 border-b border-rule"
      >
        {tabs.map((tab) => {
          const active = query.status === tab.value;
          return (
            <button
              key={tab.label}
              type="button"
              aria-pressed={active}
              onClick={() => update({ status: tab.value })}
              className={cn(
                'relative -mb-px flex items-baseline gap-2 border-b-2 px-3 pt-1 pb-3 text-[0.9375rem] transition-colors duration-150',
                active
                  ? 'border-ink font-[600] text-ink'
                  : 'border-transparent text-ink-2 hover:text-ink',
              )}
            >
              {tab.label}
              <span className="text-sm text-ink-3">{tab.count ?? '·'}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3"
          />
          <Input
            type="search"
            aria-label="Search by title, client or number"
            placeholder="Search title, client or number"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          Sort
          <Select
            value={query.sort}
            onChange={(event) => update({ sort: event.target.value as typeof query.sort })}
          >
            <option value="updated-desc">Recently updated</option>
            <option value="updated-asc">Least recently updated</option>
            <option value="total-desc">Highest total</option>
            <option value="total-asc">Lowest total</option>
            <option value="number-desc">Newest number</option>
          </Select>
        </label>
      </div>

      {result.isPending ? (
        <RowsSkeleton />
      ) : result.isError ? (
        <Notice
          tone="error"
          title="The proposals could not be loaded"
          action={
            <Button variant="secondary" size="sm" onClick={() => void result.refetch()}>
              Try again
            </Button>
          }
        >
          {result.error.message}
        </Notice>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title={query.q || query.status ? 'No proposals match these filters' : 'No proposals yet'}
          action={
            query.q || query.status ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  update({ q: undefined, status: undefined });
                }}
              >
                Clear filters
              </Button>
            ) : (
              <ButtonLink href="/proposals/new">New proposal</ButtonLink>
            )
          }
        >
          {query.q || query.status
            ? 'Try another search or status.'
            : 'Start from a template to write your first proposal.'}
        </EmptyState>
      ) : data ? (
        <div
          className={cn(
            'transition-opacity duration-200',
            result.isPlaceholderData && 'opacity-60',
          )}
          aria-busy={result.isFetching}
        >
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Proposals, {data.total} in total</caption>
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="py-3 pr-4 index text-ink-3">
                  Proposal
                </th>
                <th scope="col" className="hidden py-3 pr-4 index text-ink-3 sm:table-cell">
                  Status
                </th>
                <th scope="col" className="py-3 pr-4 text-right index text-ink-3">
                  Total
                </th>
                <th scope="col" className="hidden py-3 pr-4 index text-ink-3 lg:table-cell">
                  Valid until
                </th>
                <th scope="col" className="hidden py-3 text-right index text-ink-3 md:table-cell">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const expired = item.status === 'sent' && isExpired(item.validUntil, today);
                return (
                  <tr
                    key={item.id}
                    className="group relative border-b border-rule transition-colors duration-150 hover:bg-raised"
                  >
                    <td className="py-4 pr-4 pl-1 align-top">
                      <Link
                        href={`/proposals/${item.id}`}
                        className="font-[600] after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-focus"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-ink-2">
                        {item.clientCompany}
                        <span className="text-ink-3"> · {item.number}</span>
                        {item.isExample ? <span className="text-ink-3"> · Example</span> : null}
                      </p>
                      <StatusBadge status={item.status} className="mt-1 sm:hidden" />
                    </td>
                    <td className="hidden py-4 pr-4 align-top sm:table-cell">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 pr-8 text-right align-top whitespace-nowrap">
                      {formatMoney(item.totalMinor, item.currency)}
                    </td>
                    <td className="hidden py-4 pr-4 align-top text-sm whitespace-nowrap text-ink-2 lg:table-cell">
                      {item.validUntil ? formatDocumentDate(item.validUntil) : '—'}
                      {expired ? <span className="block text-danger">Expired</span> : null}
                    </td>
                    <td className="hidden py-4 text-right align-top text-sm whitespace-nowrap text-ink-3 md:table-cell">
                      {formatRelative(item.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-4 pt-5"
          >
            <p className="text-sm text-ink-3">
              Page {data.page} of {pageCount} · {data.total} proposals
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => update({ page: data.page - 1 })}
              >
                <ArrowLeft aria-hidden />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={data.page >= pageCount}
                onClick={() => update({ page: data.page + 1 })}
              >
                Next
                <ArrowRight aria-hidden />
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
