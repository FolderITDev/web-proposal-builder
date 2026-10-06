import { Check, Minus } from 'lucide-react';

import { type ProposalStatus, STATUS_LABEL } from '@/domain/proposal/status';
import { cn } from '@/lib/cn';

/** Status as a word with a small mark; the mark reinforces the word and never replaces it. */
export function StatusBadge({ status, className }: { status: ProposalStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm whitespace-nowrap', className)}>
      {status === 'accepted' ? (
        <Check aria-hidden className="size-3.5 text-ink" strokeWidth={2.25} />
      ) : status === 'declined' ? (
        <Minus aria-hidden className="size-3.5 text-ink-3" strokeWidth={2.25} />
      ) : (
        <span
          aria-hidden
          className={cn(
            'size-2 rounded-full',
            status === 'sent' ? 'bg-brass' : 'border border-steel bg-transparent',
          )}
        />
      )}
      <span className={status === 'declined' ? 'text-ink-3' : 'text-ink'}>
        {STATUS_LABEL[status]}
      </span>
    </span>
  );
}
