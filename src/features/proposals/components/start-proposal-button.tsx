'use client';

import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { type Template } from '@/lib/validation/proposal';

import { createProposal } from '../queries';

type StartProposalButtonProps = {
  template?: Template;
  label?: string;
  variant?: 'primary' | 'secondary';
};

/** Creates a draft from a template and opens it in the editor. */
export function StartProposalButton({
  template = 'web-app',
  label = 'Start a proposal',
  variant = 'primary',
}: StartProposalButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const proposal = await createProposal(template);
      router.push(`/proposals/${proposal.id}`);
    } catch (caught) {
      setBusy(false);
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'The proposal could not be created. Try again.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant={variant} onClick={() => void start()} disabled={busy} aria-busy={busy}>
        {label}
        {busy ? <LoaderCircle aria-hidden className="animate-spin" /> : <ArrowRight aria-hidden />}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
