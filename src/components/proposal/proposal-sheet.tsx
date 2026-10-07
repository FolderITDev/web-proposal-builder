import { type ReactNode } from 'react';

import { formatMoney } from '@/domain/proposal/money';
import { formatBasisPoints } from '@/domain/proposal/totals';
import { cn } from '@/lib/cn';
import { formatDocumentDate, formatQuantity } from '@/lib/proposal-format';
import { type ProposalDocument, type ProposalTotals } from '@/lib/validation/proposal';

import { BrandLogo } from './brand-logo';

type ProposalSheetProps = {
  document: ProposalDocument;
  totals: ProposalTotals;
  number: string;
  className?: string;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-rule pt-5">
      <h3 className="serif text-[1.125rem] font-[450] tracking-[-0.005em]">{title}</h3>
      {children}
    </section>
  );
}

/**
 * The proposal as the client will read it. The editor preview, the share page and the landing
 * page render this component; the document renderer receives the same document and totals.
 * Brand color is the only color the author controls; everything else stays neutral.
 */
export function ProposalSheet({ document, totals, number, className }: ProposalSheetProps) {
  const { client, project, pricing, terms, branding } = document;
  const money = (minor: number) => formatMoney(minor, pricing.currency);
  const included = document.scope.filter((item) => item.included);
  const excluded = document.scope.filter((item) => !item.included);

  return (
    <article
      className={cn(
        'flex flex-col gap-7 bg-raised p-7 text-[0.875rem] leading-relaxed text-ink sm:p-10',
        className,
      )}
      aria-label={`Proposal ${number}: ${document.title}`}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex items-center gap-3">
          <BrandLogo
            logo={branding.logo}
            companyName={branding.companyName}
            color={branding.color}
            size={34}
          />
          <span className="text-[0.9375rem] font-[620]">{branding.companyName}</span>
        </div>
        <div className="text-[0.75rem] text-ink-3 sm:text-right">
          <p className="index whitespace-nowrap">Proposal {number}</p>
          {terms.validUntil ? <p>Valid until {formatDocumentDate(terms.validUntil)}</p> : null}
        </div>
      </header>

      <div className="flex flex-col gap-1">
        <h2 className="serif text-[clamp(1.625rem,1.3rem+1vw,2.125rem)] leading-[1.12] font-[330] tracking-[-0.015em]">
          {document.title}
        </h2>
        <div aria-hidden className="mt-3 h-0.5 w-12" style={{ backgroundColor: branding.color }} />
      </div>

      <dl className="grid gap-6 border-y border-rule py-4 sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <dt className="mb-1 index text-ink-3">Prepared for</dt>
          <dd className="font-[600]">{client.company}</dd>
          {client.contactName ? <dd>{client.contactName}</dd> : null}
          {client.email ? <dd className="text-ink-3">{client.email}</dd> : null}
          {client.address ? <dd className="text-ink-3">{client.address}</dd> : null}
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="mb-1 index text-ink-3">Prepared by</dt>
          <dd className="font-[600]">{branding.companyName}</dd>
          {branding.email ? <dd className="text-ink-3">{branding.email}</dd> : null}
          {branding.phone ? <dd className="text-ink-3">{branding.phone}</dd> : null}
          {branding.website ? <dd className="text-ink-3">{branding.website}</dd> : null}
        </div>
      </dl>

      <Section title={project.name}>
        {project.summary ? <p>{project.summary}</p> : null}
        {project.objectives.length ? (
          <ul className="flex flex-col gap-1">
            {project.objectives.map((objective, index) => (
              <li key={`${objective}-${index}`} className="flex gap-2.5">
                <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-steel" />
                {objective}
              </li>
            ))}
          </ul>
        ) : null}
        {project.startDate || project.durationWeeks ? (
          <p className="text-ink-3">
            {[
              project.startDate ? `Starts ${formatDocumentDate(project.startDate)}` : null,
              project.durationWeeks ? `${project.durationWeeks} weeks` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}
      </Section>

      {document.scope.length ? (
        <Section title="Scope">
          <ul className="flex flex-col">
            {included.map((item, index) => (
              <li
                key={`${item.name}-${index}`}
                className="border-b border-sunk py-2.5 last:border-0"
              >
                <p className="font-[600]">{item.name}</p>
                {item.description ? <p className="text-ink-2">{item.description}</p> : null}
                {item.notes ? <p className="text-ink-3 italic">{item.notes}</p> : null}
              </li>
            ))}
          </ul>
          {excluded.length ? (
            <div className="flex flex-col gap-1 rounded-sm bg-surface px-4 py-3">
              <p className="index text-ink-3">Not included</p>
              {excluded.map((item, index) => (
                <p key={`${item.name}-${index}`} className="text-ink-2">
                  {item.name}
                  {item.notes ? ` — ${item.notes}` : ''}
                </p>
              ))}
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section title="Investment">
        {document.lineItems.length ? (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="py-2 pr-3 index font-[560] text-ink-3">
                  Service
                </th>
                <th
                  scope="col"
                  className="hidden py-2 pr-3 text-right index font-[560] text-ink-3 sm:table-cell"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="hidden py-2 pr-3 text-right index font-[560] text-ink-3 sm:table-cell"
                >
                  Rate
                </th>
                <th scope="col" className="py-2 text-right index font-[560] text-ink-3">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {document.lineItems.map((item, index) => (
                <tr key={`${item.service}-${index}`} className="border-b border-sunk align-top">
                  <td className="py-2.5 pr-3">
                    <p className="font-[600]">{item.service}</p>
                    {item.description ? <p className="text-ink-2">{item.description}</p> : null}
                    <p className="text-ink-3 sm:hidden">
                      {formatQuantity(item.quantity, item.unit)}
                      {item.unit === 'fixed' ? '' : ` × ${money(item.unitPriceMinor)}`}
                    </p>
                  </td>
                  <td className="hidden py-2.5 pr-3 text-right whitespace-nowrap sm:table-cell">
                    {formatQuantity(item.quantity, item.unit)}
                  </td>
                  <td className="hidden py-2.5 pr-3 text-right whitespace-nowrap sm:table-cell">
                    {item.unit === 'fixed' ? '—' : money(item.unitPriceMinor)}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    {money(totals.lines[index] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-ink-3">No services yet.</p>
        )}
        <dl className="ml-auto flex w-full max-w-72 flex-col gap-1 pt-1">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-3">Subtotal</dt>
            <dd>{money(totals.subtotal)}</dd>
          </div>
          {totals.discount ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">
                Discount
                {pricing.discountType === 'percent'
                  ? ` (${formatBasisPoints(pricing.discountValue)})`
                  : ''}
              </dt>
              <dd>− {money(totals.discount)}</dd>
            </div>
          ) : null}
          {pricing.taxRateBps ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">
                {pricing.taxLabel || 'Tax'} ({formatBasisPoints(pricing.taxRateBps)})
              </dt>
              <dd>{money(totals.tax)}</dd>
            </div>
          ) : null}
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-ink pt-2">
            <dt className="font-[600]">Total</dt>
            <dd className="serif text-[1.375rem] font-[500] tracking-[-0.01em]">
              {money(totals.total)}
            </dd>
          </div>
        </dl>
      </Section>

      {terms.milestones.length ? (
        <Section title="Payment schedule">
          <table className="w-full border-collapse text-left">
            <tbody>
              {terms.milestones.map((milestone, index) => (
                <tr key={`${milestone.name}-${index}`} className="border-b border-sunk">
                  <td className="py-2 pr-3">{milestone.name}</td>
                  <td className="py-2 pr-3 text-ink-3">{milestone.due}</td>
                  <td className="py-2 pr-3 text-right text-ink-3">
                    {formatBasisPoints(milestone.percentBps)}
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    {money(totals.milestones[index] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}

      {terms.paymentTerms || terms.conditions || terms.notes ? (
        <Section title="Terms">
          {terms.paymentTerms ? <p>Payment: {terms.paymentTerms}</p> : null}
          {terms.conditions ? <p className="text-ink-2">{terms.conditions}</p> : null}
          {terms.notes ? <p className="text-ink-3">{terms.notes}</p> : null}
        </Section>
      ) : null}
    </article>
  );
}
