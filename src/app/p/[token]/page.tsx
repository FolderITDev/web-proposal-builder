import { Download } from 'lucide-react';
import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ProposalSheet } from '@/components/proposal/proposal-sheet';
import { buttonStyles } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/feedback';
import { BASE_PATH, siteConfig } from '@/config/site';
import { NotFoundError } from '@/server/errors';
import { proposalService } from '@/server/services';

/** Shared proposals belong to their recipients, not to search engines. */
export const metadata: Metadata = {
  title: 'Shared proposal',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

async function SharedProposal({ token }: { token: string }) {
  let proposal;
  try {
    proposal = await proposalService().getShared(token);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-ink-2">
          {proposal.document.branding.companyName} shared this proposal with you.
        </p>
        <a href={`${BASE_PATH}/api/share/${token}/pdf`} className={buttonStyles({ size: 'sm' })}>
          <Download aria-hidden />
          Download PDF
        </a>
      </div>
      <div className="overflow-hidden rounded-md shadow-(--shadow-sheet)">
        <ProposalSheet
          document={proposal.document}
          totals={proposal.totals}
          number={proposal.number}
        />
      </div>
    </div>
  );
}

export default function SharedProposalPage({ params }: PageProps<'/p/[token]'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<Skeleton className="h-[48rem]" />}>
          {params.then(({ token }) => (
            <SharedProposal token={token} />
          ))}
        </Suspense>
      </main>
      <footer className="border-t border-rule">
        <p className="mx-auto max-w-3xl px-4 py-5 text-[0.8125rem] text-ink-3 sm:px-6">
          Prepared with{' '}
          <Link href="/" className="underline decoration-steel underline-offset-2 hover:text-ink">
            {siteConfig.name}
          </Link>{' '}
          by{' '}
          <a
            href={siteConfig.company.url}
            className="underline decoration-steel underline-offset-2 hover:text-ink"
          >
            Folder IT
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
