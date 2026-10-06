'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { ProposalSheet } from '@/components/proposal/proposal-sheet';
import { Button, ButtonLink } from '@/components/ui/button';
import { Notice, Skeleton } from '@/components/ui/feedback';
import { STATUS_LABEL } from '@/domain/proposal/status';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import {
  type Proposal,
  type ProposalDocument,
  ProposalDocumentSchema,
} from '@/lib/validation/proposal';

import { proposalQuery, useDuplicateProposal, useSaveProposal } from '../queries';
import { EditorToolbar } from './editor-toolbar';
import { previewTotals } from './preview-totals';
import {
  BrandingSection,
  ClientSection,
  ProjectSection,
  ScopeSection,
  ServicesSection,
  TermsSection,
} from './sections';
import { useAutosave } from './use-autosave';

const SECTIONS = [
  ['client', 'Client'],
  ['project', 'Project'],
  ['scope', 'Scope'],
  ['services', 'Pricing'],
  ['terms', 'Terms'],
  ['branding', 'Branding'],
] as const;

export function EditorSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-8">
      <span className="sr-only">Loading the proposal</span>
      <Skeleton className="h-24" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-[36rem]" />
      </div>
    </div>
  );
}

function ReadOnlyNotice({ proposal }: { proposal: Proposal }) {
  const router = useRouter();
  const duplicate = useDuplicateProposal();
  const openCopy = () =>
    duplicate.mutate(proposal.id, { onSuccess: (copy) => router.push(`/proposals/${copy.id}`) });
  const save = useSaveProposal(proposal.id);
  if (proposal.isExample) {
    return (
      <Notice
        title="Example proposals are read-only."
        action={
          <Button variant="secondary" size="sm" onClick={openCopy} disabled={duplicate.isPending}>
            Duplicate to edit
          </Button>
        }
      >
        Your copy is a new draft with the same content.
      </Notice>
    );
  }
  return (
    <Notice
      title={`${STATUS_LABEL[proposal.status]} proposals are frozen as they were sent.`}
      action={
        proposal.status === 'accepted' ? (
          <Button variant="secondary" size="sm" onClick={openCopy} disabled={duplicate.isPending}>
            Duplicate to revise
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => save.mutate({ version: proposal.version, status: 'draft' })}
            disabled={save.isPending}
          >
            Move back to draft
          </Button>
        )
      }
    >
      {proposal.status === 'accepted'
        ? 'An accepted proposal is a commitment and cannot change.'
        : 'Move it back to draft to make changes.'}
    </Notice>
  );
}

function EditorForm({ proposal, onReload }: { proposal: Proposal; onReload: () => void }) {
  const form = useForm<ProposalDocument>({
    defaultValues: proposal.document,
    resolver: zodResolver(ProposalDocumentSchema),
    mode: 'onChange',
  });
  const values = useWatch({ control: form.control }) as ProposalDocument;
  const totals = useMemo(() => previewTotals(values), [values]);
  const autosave = useAutosave(proposal, values, proposal.canEdit);
  const [view, setView] = useState<'edit' | 'preview'>('edit');

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <EditorToolbar
          proposal={proposal}
          title={values.title}
          status={autosave.status}
          onRetry={autosave.retry}
        />

        {autosave.status.kind === 'conflict' ? (
          <Notice
            tone="error"
            title="This proposal was changed in another tab or window."
            action={
              <Button variant="secondary" size="sm" onClick={onReload}>
                Reload the latest version
              </Button>
            }
          >
            Your recent edits here were not saved, so nothing was overwritten.
          </Notice>
        ) : null}
        {!proposal.canEdit ? <ReadOnlyNotice proposal={proposal} /> : null}

        <div
          role="group"
          aria-label="View"
          className="flex gap-1 self-start rounded-sm border border-steel bg-raised p-0.5 lg:hidden"
        >
          {(['edit', 'preview'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={cn(
                'rounded-[2px] px-4 py-1.5 text-sm',
                view === option ? 'bg-ink text-white' : 'text-ink-2',
              )}
            >
              {option === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:gap-14">
          <form
            noValidate
            onSubmit={(event) => event.preventDefault()}
            aria-label="Proposal editor"
            className={cn(
              'min-w-0 flex-col gap-10',
              view === 'preview' ? 'hidden lg:flex' : 'flex',
            )}
          >
            <nav
              aria-label="Editor sections"
              className="sticky top-16 z-10 -mx-1 flex gap-1 overflow-x-auto bg-dial px-1 py-3"
            >
              {SECTIONS.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded-sm px-3 py-1.5 text-sm whitespace-nowrap text-ink-2 hover:bg-sunk hover:text-ink"
                >
                  {label}
                </a>
              ))}
            </nav>
            <fieldset
              disabled={!proposal.canEdit}
              className="flex min-w-0 flex-col gap-12 disabled:opacity-80"
            >
              <legend className="sr-only">Proposal content</legend>
              <ClientSection />
              <ProjectSection />
              <ScopeSection />
              <ServicesSection totals={totals} />
              <TermsSection totals={totals} />
              <BrandingSection />
            </fieldset>
          </form>

          <aside
            aria-label="Live preview"
            className={cn('min-w-0', view === 'edit' ? 'hidden lg:block' : 'block')}
          >
            <div className="sticky top-24 flex flex-col gap-3 lg:max-h-[calc(100dvh-7.5rem)]">
              <p className="index text-ink-3">Live preview</p>
              <div
                tabIndex={0}
                role="region"
                aria-label="Proposal preview"
                className="overflow-y-auto rounded-md shadow-(--shadow-sheet)"
              >
                <ProposalSheet document={values} totals={totals} number={proposal.number} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </FormProvider>
  );
}

/** Loads a proposal and hands it to the form. A reload after a conflict remounts the form. */
export function ProposalEditor({ id }: { id: string }) {
  const query = useQuery(proposalQuery(id));
  const [generation, setGeneration] = useState(0);

  if (query.isPending) return <EditorSkeleton />;

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <h1 className="serif text-title font-[330]">
          {notFound ? 'Proposal not found' : 'The proposal could not be loaded'}
        </h1>
        <Notice
          tone={notFound ? 'info' : 'error'}
          title={
            notFound
              ? 'This proposal does not exist, was removed, or belongs to another browser.'
              : query.error.message
          }
          action={
            notFound ? (
              <ButtonLink href="/proposals" variant="secondary" size="sm">
                Back to proposals
              </ButtonLink>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
                Try again
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <EditorForm
      key={`${query.data.id}:${generation}`}
      proposal={query.data}
      onReload={() => void query.refetch().then(() => setGeneration((value) => value + 1))}
    />
  );
}
