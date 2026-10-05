export const PROPOSAL_STATUSES = ['draft', 'sent', 'accepted', 'declined'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
};

/**
 * Allowed status changes. A proposal is sent from a draft, answered once it has been sent, and
 * can be reopened as a draft unless it was accepted: an accepted proposal is a commitment.
 */
const TRANSITIONS: Record<ProposalStatus, readonly ProposalStatus[]> = {
  draft: ['sent'],
  sent: ['accepted', 'declined', 'draft'],
  accepted: [],
  declined: ['draft'],
};

export function allowedTransitions(from: ProposalStatus): readonly ProposalStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: ProposalStatus, to: ProposalStatus): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

/** Only drafts are editable; any other status freezes the document as it was sent. */
export function isEditable(status: ProposalStatus): boolean {
  return status === 'draft';
}

/** A proposal is expired when its validity date is before today (both as YYYY-MM-DD). */
export function isExpired(validUntil: string | null, today: string): boolean {
  return validUntil !== null && validUntil < today;
}

export function formatProposalNumber(year: number, sequence: number): string {
  return `PB-${year}-${String(sequence).padStart(4, '0')}`;
}
