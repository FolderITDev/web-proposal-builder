import { Plus } from 'lucide-react';
import { type Metadata } from 'next';
import { Suspense } from 'react';

import { ButtonLink } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/feedback';
import { ProposalList } from '@/features/proposals/components/proposal-list';

export const metadata: Metadata = { title: 'Proposals' };

export default function ProposalsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="serif text-title font-[330]">Proposals</h1>
          <p className="max-w-[60ch] text-lead text-ink-2">
            Your proposals from this browser, alongside example proposals you can open or duplicate.
          </p>
        </div>
        <ButtonLink href="/proposals/new">
          <Plus aria-hidden />
          New proposal
        </ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProposalList />
      </Suspense>
    </div>
  );
}
