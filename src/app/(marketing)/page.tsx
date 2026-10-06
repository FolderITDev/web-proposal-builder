import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { type Metadata } from 'next';
import Link from 'next/link';
import { type ReactNode } from 'react';

import { Guilloche } from '@/components/dial/guilloche';
import { SubDial } from '@/components/dial/sub-dial';
import { BrandLogo } from '@/components/proposal/brand-logo';
import { ProposalSheet } from '@/components/proposal/proposal-sheet';
import { buttonStyles } from '@/components/ui/button';
import { absoluteUrl, siteConfig, siteOrigin } from '@/config/site';
import { FAQ } from '@/content/faq';
import { CURRENCIES, CURRENCY_LABEL, formatMoney } from '@/domain/proposal/money';
import { EXAMPLE, EXAMPLE_DIAL, WORKED_EXAMPLE } from '@/features/landing/example';
import { StartProposalButton } from '@/features/proposals/components/start-proposal-button';
import { LOGO_LABEL } from '@/lib/brand/logo';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  JsonLd,
  organizationJsonLd,
  webApplicationJsonLd,
} from '@/lib/seo/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';
import { BRAND_LOGOS } from '@/lib/validation/proposal';

const description =
  'Free proposal builder: write the client, scope, services, pricing and terms once, see the document update as you type, and export a PDF or share a link. Exact multi-currency totals. Built by Folder IT with Next.js and PostgreSQL.';

export const metadata: Metadata = pageMetadata({ path: '/', description });

const OUTPUTS = [
  [
    'The editor',
    'Client, project, scope, services, terms and branding in one form, validated as you type and saved a second after you stop.',
  ],
  [
    'The live preview',
    'The document your client will read, beside the editor, recalculated on every keystroke.',
  ],
  [
    'The share link',
    'A read-only page behind an unguessable link, with the same layout and a PDF download.',
  ],
  [
    'The PDF',
    'Rendered on the server from the saved proposal with self-hosted fonts, so it never depends on a print dialog.',
  ],
] as const;

const FEATURES = [
  [
    'Autosave that never overwrites',
    'Each save carries the version it started from. A stale save from another tab is refused, and the editor asks you to reload.',
  ],
  [
    'Scope in and out',
    'Every scope item is marked included or excluded, with notes, so the client reads what is not in the price.',
  ],
  [
    'Discounts, tax and milestones',
    'Percentage or fixed discounts, a labeled tax rate, and a payment schedule whose shares must add up to 100%.',
  ],
  [
    'A lifecycle, not a label',
    'Draft, sent, accepted or declined. Only drafts can be edited; an accepted proposal is final.',
  ],
  [
    'Templates and duplicates',
    'Start from a web app, mobile app or retainer template, or duplicate any example into your own draft.',
  ],
  [
    'A documented REST API',
    'Every action in the interface is an endpoint described by an OpenAPI 3.1 document.',
  ],
] as const;

const STACK = [
  [
    'Frontend',
    'Next.js App Router, React Server Components, TypeScript, Tailwind CSS, TanStack Query, React Hook Form',
  ],
  [
    'API',
    'REST Route Handlers, Zod validation of every input and output, RFC 9457 errors, OpenAPI 3.1, optimistic concurrency',
  ],
  ['Data', 'PostgreSQL with normalized child tables, Drizzle ORM, versioned SQL migrations'],
  ['Documents', 'Server-side PDF rendering with React PDF from the same model as the preview'],
  [
    'Quality',
    'Strict TypeScript, ESLint, Vitest unit and integration tests, Playwright end-to-end tests, GitHub Actions',
  ],
] as const;

function SectionHeading({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
      <h2 id={id} className="serif text-title font-[330]">
        {title}
      </h2>
      <p className="max-w-[58ch] text-lead text-ink-2">{children}</p>
    </div>
  );
}

export default function LandingPage() {
  const currency = EXAMPLE.document.pricing.currency;

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          webApplicationJsonLd(),
          breadcrumbJsonLd([
            { name: 'Folder IT', url: siteConfig.company.url },
            { name: 'Apps', url: `${siteOrigin()}/apps` },
            { name: siteConfig.name, url: absoluteUrl('/') },
          ]),
          faqJsonLd(FAQ),
        ]}
      />

      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <Guilloche className="pointer-events-none absolute top-1/2 -right-[22rem] hidden size-[64rem] -translate-y-1/2 text-ink opacity-[0.07] lg:block" />
        <div className="relative mx-auto grid max-w-[88rem] gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:py-20">
          <div className="flex flex-col justify-center gap-8">
            <h1 className="serif text-display font-[300]">Proposals that add up, to the cent.</h1>
            <p className="max-w-[46ch] text-lead text-ink-2">
              Write the client, scope, services and terms once. The document beside the editor
              updates as you type, totals are exact in eight currencies, and the same numbers go
              into the PDF and the share link.
            </p>
            <div className="flex flex-wrap items-start gap-3">
              <StartProposalButton />
              <Link href="/proposals" className={buttonStyles({ variant: 'quiet' })}>
                Browse example proposals
                <ArrowRight aria-hidden />
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-3">
              <li>Free, no account</li>
              <li>Saves as you type</li>
              <li>PDF and share link</li>
            </ul>
          </div>

          <div className="relative min-w-0 lg:pl-6">
            <div className="relative max-h-[38rem] overflow-hidden rounded-md [mask-image:linear-gradient(to_bottom,black_78%,transparent)] shadow-(--shadow-sheet)">
              <ProposalSheet
                document={EXAMPLE.document}
                totals={EXAMPLE.totals}
                number={EXAMPLE.number}
              />
            </div>
            <div className="relative mt-6 rounded-md border border-rule bg-raised p-5 shadow-(--shadow-sheet) sm:absolute sm:right-0 sm:-bottom-4 sm:mt-0 sm:w-[20rem] lg:-right-6">
              <SubDial
                size={200}
                segments={EXAMPLE_DIAL}
                centerLabel="Total"
                centerValue={formatMoney(EXAMPLE.totals.total, currency)}
                caption={`Payment schedule for the example proposal: ${EXAMPLE_DIAL.map((segment) => `${segment.label}, ${segment.detail}`).join('; ')}.`}
              />
            </div>
            <p className="mt-4 text-[0.8125rem] text-ink-3 sm:mt-6 sm:pr-[22rem]">
              An example proposal, priced by the same functions the editor, the API and the PDF use.
            </p>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="outputs-title"
        className="border-t border-ink bg-surface"
      >
        <div className="mx-auto flex max-w-[88rem] flex-col gap-10 px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading id="outputs-title" title="One document model, four outputs">
            A proposal is stored once, as a validated document with its client, scope, services and
            terms. Everything the client sees is rendered from that model, so the preview, the link
            and the PDF can never disagree.
          </SectionHeading>
          <ol className="border-t border-rule">
            {OUTPUTS.map(([title, text]) => (
              <li
                key={title}
                className="grid gap-x-10 gap-y-2 border-b border-rule py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:items-baseline"
              >
                <h3 className="flex items-baseline gap-4 serif text-[1.625rem] font-[350] tracking-[-0.01em]">
                  <span aria-hidden className="h-px w-6 translate-y-[-0.35em] bg-brass" />
                  {title}
                </h3>
                <p className="max-w-[60ch] leading-relaxed text-ink-2">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing-math" aria-labelledby="math-title">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-12 px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading id="math-title" title="Pricing math you can check by hand">
            Amounts are integer cents from the form to the database. Each step rounds once, in a
            fixed order, and the payment schedule distributes the total so the milestones add up to
            it exactly.
          </SectionHeading>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <ol className="flex flex-col border-t border-ink">
              {[
                [
                  'Lines',
                  'Quantity in hundredths times the rate in cents, rounded half up to the cent.',
                ],
                [
                  'Discount',
                  'A percentage of the subtotal, or a fixed amount, never more than the subtotal.',
                ],
                ['Tax', 'The labeled rate applied to the discounted amount, rounded once.'],
                [
                  'Milestones',
                  'Each share is floored; leftover cents go to the largest remainders, ties to the earliest.',
                ],
              ].map(([term, text]) => (
                <li
                  key={term}
                  className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-rule py-4"
                >
                  <span className="font-[600]">{term}</span>
                  <span className="text-ink-2">{text}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-6 rounded-md border border-rule bg-raised p-6 sm:p-8">
              <p className="index text-ink-3">Worked example in EUR, 10% discount, 21% VAT</p>
              <dl className="flex flex-col text-[0.9375rem]">
                {WORKED_EXAMPLE.lines.map((line) => (
                  <div
                    key={line.label}
                    className="flex justify-between gap-6 border-b border-sunk py-2"
                  >
                    <dt className="text-ink-2">{line.label}</dt>
                    <dd className="whitespace-nowrap">{line.amount}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-6 py-2">
                  <dt className="text-ink-2">Subtotal</dt>
                  <dd>{WORKED_EXAMPLE.subtotal}</dd>
                </div>
                <div className="flex justify-between gap-6 py-2">
                  <dt className="text-ink-2">Discount (10%)</dt>
                  <dd>− {WORKED_EXAMPLE.discount}</dd>
                </div>
                <div className="flex justify-between gap-6 py-2">
                  <dt className="text-ink-2">VAT (21%)</dt>
                  <dd>{WORKED_EXAMPLE.tax}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-6 border-t border-ink pt-3">
                  <dt className="font-[600]">Total</dt>
                  <dd className="serif text-[1.5rem] font-[450]">{WORKED_EXAMPLE.total}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-[600]">Split in three payments</p>
                <ul className="grid grid-cols-3 gap-3 text-sm">
                  {WORKED_EXAMPLE.split.map((part, index) => (
                    <li key={index} className="flex flex-col rounded-sm bg-surface px-3 py-2">
                      <span className="text-ink-3">{part.share}</span>
                      <span>{part.amount}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-ink-3">
                  The three payments add up to {WORKED_EXAMPLE.splitSum}, the total, without a
                  missing cent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title" className="border-t border-ink bg-surface">
        <div className="mx-auto flex max-w-[88rem] flex-col gap-12 px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            id="features-title"
            title="Built for the way proposals are actually written"
          >
            Proposals are long, edited over days and sent to people outside your company. The
            builder is designed around those three facts.
          </SectionHeading>
          <dl className="grid gap-x-16 border-t border-rule md:grid-cols-2">
            {FEATURES.map(([term, text]) => (
              <div key={term} className="flex flex-col gap-1.5 border-b border-rule py-6">
                <dt className="text-[1.0625rem] font-[600]">{term}</dt>
                <dd className="max-w-[56ch] leading-relaxed text-ink-2">{text}</dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-[600]">Eight currencies, always with their code</h3>
              <ul className="flex flex-wrap gap-2">
                {CURRENCIES.map((code) => (
                  <li
                    key={code}
                    className="flex items-baseline gap-2 rounded-sm border border-rule bg-raised px-3 py-1.5 text-sm"
                  >
                    <span className="font-[600]">{code}</span>
                    <span className="text-ink-3">{CURRENCY_LABEL[code]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-[600]">Your brand on the document</h3>
              <ul className="flex flex-wrap gap-5">
                {BRAND_LOGOS.map((logo, index) => (
                  <li key={logo} className="flex items-center gap-2.5 text-sm text-ink-2">
                    <BrandLogo
                      logo={logo}
                      companyName="Halden Works"
                      color={['#1c2a44', '#1f4e5a', '#5a2430', '#3f2e56'][index] ?? '#1c2a44'}
                      size={30}
                    />
                    {LOGO_LABEL[logo]}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-3">
                Four logo marks, drawn from your company name and brand color, with your contact
                details.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="built-by-title" className="border-t border-ink">
        <div className="mx-auto grid max-w-[88rem] gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-28">
          <div className="flex flex-col gap-6">
            <h2 id="built-by-title" className="serif text-title font-[330]">
              Built by Folder IT
            </h2>
            <div className="flex max-w-[60ch] flex-col gap-4 text-lead text-ink-2">
              <p>
                <a
                  href={siteConfig.company.url}
                  className="text-ink underline decoration-steel underline-offset-4 hover:decoration-ink"
                >
                  Folder IT
                </a>{' '}
                is a nearshore software development company that builds custom web and mobile
                applications, business platforms and AI-ready engineering teams for U.S. companies.
              </p>
              <p>
                The team builds and maintains Proposal Builder the way it builds client software:
                complex validated forms, autosave with concurrency control, exact money handling, a
                normalized PostgreSQL model, server-side document generation and a documented REST
                API, with tests at every layer.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href={siteConfig.repositoryUrl} className={buttonStyles({ variant: 'secondary' })}>
                View the source code
                <ArrowUpRight aria-hidden />
              </a>
              <Link href="/docs/api" className={buttonStyles({ variant: 'quiet' })}>
                Read the API reference
                <ArrowRight aria-hidden />
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-[600]">Technologies</h3>
            <dl className="flex flex-col divide-y divide-rule border-y border-rule">
              {STACK.map(([area, items]) => (
                <div
                  key={area}
                  className="grid gap-1 py-3.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6"
                >
                  <dt className="pt-1 index text-ink-3">{area}</dt>
                  <dd className="text-[0.9375rem] leading-relaxed">{items}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="border-t border-rule bg-surface">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:py-28">
          <h2 id="faq-title" className="serif text-title font-[330]">
            Questions
          </h2>
          <div className="border-t border-ink">
            {FAQ.map((item) => (
              <details key={item.question} className="group border-b border-rule">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.0625rem] font-[560] [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden
                    className="relative size-3 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-ink after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-ink after:transition-transform after:duration-200 after:ease-(--ease-out) group-open:after:scale-y-0"
                  />
                </summary>
                <p className="max-w-[68ch] pb-6 leading-relaxed text-ink-2">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="close-title" className="border-t border-ink">
        <div className="mx-auto flex max-w-[88rem] flex-col items-start gap-8 px-5 py-20 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-24">
          <h2
            id="close-title"
            className="max-w-[18ch] serif text-[clamp(2.25rem,1.5rem+3vw,3.5rem)] leading-[1.06] font-[300] tracking-[-0.02em]"
          >
            Your next proposal, priced to the cent.
          </h2>
          <StartProposalButton />
        </div>
      </section>
    </>
  );
}
