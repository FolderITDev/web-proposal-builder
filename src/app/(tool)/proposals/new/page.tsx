import { type Metadata } from 'next';

import { formatMoney } from '@/domain/proposal/money';
import { documentFromTemplate } from '@/domain/proposal/templates';
import { documentTotals } from '@/domain/proposal/document';
import { StartProposalButton } from '@/features/proposals/components/start-proposal-button';
import { type Template } from '@/lib/validation/proposal';

export const metadata: Metadata = { title: 'New proposal' };

const TEMPLATES: { id: Template; name: string; description: string }[] = [
  {
    id: 'web-app',
    name: 'Web application',
    description: 'Design, development and QA by the hour, with a three-payment schedule.',
  },
  {
    id: 'mobile-app',
    name: 'Mobile application',
    description: 'Discovery days, app and back-office development, and a 5% discount.',
  },
  {
    id: 'retainer',
    name: 'Monthly retainer',
    description: 'A part-time team priced per week, invoiced monthly.',
  },
  {
    id: 'blank',
    name: 'Blank proposal',
    description: 'Only the structure, for when you know exactly what to write.',
  },
];

export default function NewProposalPage() {
  const today = '2026-01-01';
  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="serif text-title font-[330]">New proposal</h1>
        <p className="max-w-[56ch] text-lead text-ink-2">
          Start from a template. Every field stays editable, and the draft saves itself as you work.
        </p>
      </div>
      <ul className="border-t border-ink">
        {TEMPLATES.map((template) => {
          const document = documentFromTemplate(template.id, today);
          const totals = documentTotals(document);
          return (
            <li
              key={template.id}
              className="grid gap-4 border-b border-rule py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="flex flex-col gap-1">
                <h2 className="serif text-[1.375rem] font-[400]">{template.name}</h2>
                <p className="text-ink-2">{template.description}</p>
                <p className="text-sm text-ink-3">
                  {document.scope.length} scope items · {document.lineItems.length} services
                  {totals.total ? ` · ${formatMoney(totals.total, document.pricing.currency)}` : ''}
                </p>
              </div>
              <StartProposalButton
                template={template.id}
                label="Use template"
                variant={template.id === 'web-app' ? 'primary' : 'secondary'}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
