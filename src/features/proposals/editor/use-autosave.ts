'use client';

import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import { ApiError } from '@/lib/api/client';
import { type Proposal, ProposalDocumentSchema } from '@/lib/validation/proposal';

import { useSaveProposal } from '../queries';

const DEBOUNCE_MS = 900;

export type SaveStatus =
  | { kind: 'saved'; at: string }
  | { kind: 'pending' }
  | { kind: 'saving' }
  | { kind: 'invalid'; issues: number }
  | { kind: 'error'; message: string }
  | { kind: 'conflict' }
  | { kind: 'readonly' };

/**
 * Saves the form a moment after the person stops typing, but only when the document is valid
 * and different from what the server has. Every save sends the version it is based on; a 409
 * stops autosave and asks for a reload instead of overwriting someone else's work.
 */
export function useAutosave(proposal: Proposal, values: unknown, enabled: boolean) {
  const save = useSaveProposal(proposal.id);
  const parsed = useMemo(() => ProposalDocumentSchema.safeParse(values), [values]);
  const snapshot = parsed.success ? JSON.stringify(parsed.data) : null;
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(ProposalDocumentSchema.parse(proposal.document)),
  );
  const [savedAt, setSavedAt] = useState(proposal.updatedAt);
  const [failure, setFailure] = useState<
    { kind: 'error'; message: string } | { kind: 'conflict' } | null
  >(null);
  const saving = save.isPending;
  const dirty = snapshot !== null && snapshot !== savedSnapshot;

  const persist = useEffectEvent(async () => {
    if (!parsed.success || snapshot === null) return;
    try {
      const saved = await save.mutateAsync({ version: proposal.version, document: parsed.data });
      setSavedSnapshot(snapshot);
      setSavedAt(saved.updatedAt);
    } catch (error) {
      setFailure(
        error instanceof ApiError && error.status === 409
          ? { kind: 'conflict' }
          : {
              kind: 'error',
              message: error instanceof Error ? error.message : 'The proposal could not be saved.',
            },
      );
    }
  });

  useEffect(() => {
    if (!enabled || !dirty || saving || failure) return;
    const timer = setTimeout(() => void persist(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, dirty, saving, failure, snapshot]);

  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);

  const status: SaveStatus = !enabled
    ? { kind: 'readonly' }
    : failure
      ? failure
      : saving
        ? { kind: 'saving' }
        : !parsed.success
          ? { kind: 'invalid', issues: parsed.error.issues.length }
          : dirty
            ? { kind: 'pending' }
            : { kind: 'saved', at: savedAt };

  return { status, retry: () => setFailure(null), settled: status.kind === 'saved' };
}
