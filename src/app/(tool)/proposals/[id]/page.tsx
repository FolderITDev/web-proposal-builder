import { type Metadata } from 'next';
import { Suspense } from 'react';

import { EditorSkeleton, ProposalEditor } from '@/features/proposals/editor/proposal-editor';

export const metadata: Metadata = { title: 'Edit proposal' };

export default function ProposalPage({ params }: PageProps<'/proposals/[id]'>) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      {params.then(({ id }) => (
        <ProposalEditor id={id} />
      ))}
    </Suspense>
  );
}
