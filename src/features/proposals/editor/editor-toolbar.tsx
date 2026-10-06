'use client';

import { ArrowLeft, Copy, Download, Link2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, buttonStyles } from '@/components/ui/button';
import { BASE_PATH } from '@/config/site';
import { allowedTransitions, type ProposalStatus } from '@/domain/proposal/status';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/proposal-format';
import { type Proposal } from '@/lib/validation/proposal';

import { StatusBadge } from '../components/status-badge';
import { useDeleteProposal, useDuplicateProposal, useSaveProposal } from '../queries';
import { type SaveStatus } from './use-autosave';

const TRANSITION_LABEL: Record<ProposalStatus, string> = {
  draft: 'Move back to draft',
  sent: 'Mark as sent',
  accepted: 'Mark as accepted',
  declined: 'Mark as declined',
};

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  const text: Record<SaveStatus['kind'], string> = {
    saved: status.kind === 'saved' ? `Saved ${formatRelative(status.at)}` : '',
    pending: 'Unsaved changes',
    saving: 'Saving…',
    invalid:
      status.kind === 'invalid'
        ? `Fix ${status.issues} ${status.issues === 1 ? 'field' : 'fields'} to save`
        : '',
    error: 'Not saved',
    conflict: 'Changed elsewhere',
    readonly: 'Read-only',
  };
  return (
    <p
      role="status"
      className={cn(
        'flex items-center gap-2 text-sm',
        status.kind === 'invalid' || status.kind === 'error' ? 'text-danger' : 'text-ink-3',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          status.kind === 'saved'
            ? 'bg-ink'
            : status.kind === 'saving' || status.kind === 'pending'
              ? 'animate-pulse bg-brass motion-reduce:animate-none'
              : 'bg-steel',
        )}
      />
      {text[status.kind]}
      {status.kind === 'error' ? (
        <button type="button" onClick={onRetry} className="underline underline-offset-2">
          Retry
        </button>
      ) : null}
    </p>
  );
}

type EditorToolbarProps = {
  proposal: Proposal;
  title: string;
  status: SaveStatus;
  onRetry: () => void;
};

/** Identity, save state and every action on the proposal, in one bar above the editor. */
export function EditorToolbar({ proposal, title, status, onRetry }: EditorToolbarProps) {
  const router = useRouter();
  const save = useSaveProposal(proposal.id);
  const duplicate = useDuplicateProposal();
  const remove = useDeleteProposal();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const settled = status.kind === 'saved' || status.kind === 'readonly';
  const owned = !proposal.isExample;
  const failure = save.error ?? duplicate.error ?? remove.error;

  async function share() {
    const url = `${window.location.origin}${BASE_PATH}/p/${proposal.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Share link copied.');
    } catch {
      setMessage(url);
    }
  }

  return (
    <div className="flex flex-col gap-4 border-b border-rule pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/proposals"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Proposals
        </Link>
        <SaveIndicator status={status} onRetry={onRetry} />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
            <span className="index">{proposal.number}</span>
            <StatusBadge status={proposal.status} />
            {proposal.isExample ? <span>Example proposal</span> : null}
          </p>
          <h1 className="serif text-[clamp(1.625rem,1.3rem+1.2vw,2.25rem)] leading-tight font-[330] tracking-[-0.015em] break-words">
            {title || 'Untitled proposal'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {owned
            ? allowedTransitions(proposal.status).map((next) => (
                <Button
                  key={next}
                  variant={next === 'sent' || next === 'accepted' ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={!settled || save.isPending}
                  onClick={() => save.mutate({ version: proposal.version, status: next })}
                >
                  {TRANSITION_LABEL[next]}
                </Button>
              ))
            : null}
          <Button variant="secondary" size="sm" onClick={() => void share()}>
            <Link2 aria-hidden />
            Share
          </Button>
          <a
            href={`${BASE_PATH}/api/proposals/${proposal.id}/pdf`}
            aria-disabled={!settled}
            className={cn(
              buttonStyles({ variant: 'secondary', size: 'sm' }),
              !settled && 'pointer-events-none opacity-45',
            )}
          >
            <Download aria-hidden />
            PDF
          </a>
          <Button
            variant="secondary"
            size="sm"
            disabled={duplicate.isPending}
            onClick={() =>
              duplicate.mutate(proposal.id, {
                onSuccess: (copy) => router.push(`/proposals/${copy.id}`),
              })
            }
          >
            <Copy aria-hidden />
            Duplicate
          </Button>
          {owned ? (
            confirmingDelete ? (
              <span role="group" aria-label="Confirm deletion" className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(proposal.id, { onSuccess: () => router.replace('/proposals') })
                  }
                >
                  Delete proposal
                </Button>
                <Button variant="quiet" size="sm" onClick={() => setConfirmingDelete(false)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button
                variant="quiet"
                size="sm"
                aria-label="Delete proposal"
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 aria-hidden />
              </Button>
            )
          ) : null}
        </div>
      </div>

      <div aria-live="polite" className="text-sm">
        {message ? <p className="break-all text-ink-2">{message}</p> : null}
        {failure ? (
          <p role="alert" className="text-danger">
            {failure instanceof ApiError ? failure.message : 'The action could not be completed.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
