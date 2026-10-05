import { type ProposalStatus } from '@/domain/proposal/status';
import { documentFromTemplate } from '@/domain/proposal/templates';
import { type ProposalDocument } from '@/lib/validation/proposal';

/**
 * Example proposals: read-only for every visitor and the starting point of a duplicate. Contact
 * details use folderit.net.
 */
export type ExampleProposal = {
  status: ProposalStatus;
  daysAgo: number;
  document: ProposalDocument;
};

const STUDIOS = {
  halden: {
    companyName: 'Halden Works',
    logo: 'orbit',
    color: '#1c2a44',
    email: 'proposals@halden.folderit.net',
    phone: '',
    website: 'halden.folderit.net',
    address: '400 Alder Street, Suite 12, Portland, OR',
  },
  tessera: {
    companyName: 'Tessera Consulting',
    logo: 'facet',
    color: '#1f4e5a',
    email: 'hello@tessera.folderit.net',
    phone: '',
    website: 'tessera.folderit.net',
    address: '18 Calder Row, Leeds',
  },
  ostrander: {
    companyName: 'Ostrander & Lowe Digital',
    logo: 'stack',
    color: '#5a2430',
    email: 'studio@ostrander.folderit.net',
    phone: '',
    website: 'ostrander.folderit.net',
    address: '91 Mercer Lane, Toronto, ON',
  },
  quillon: {
    companyName: 'Quillon Labs',
    logo: 'monogram',
    color: '#3f2e56',
    email: 'proposals@quillon.folderit.net',
    phone: '',
    website: 'quillon.folderit.net',
    address: 'Rua das Acácias 210, São Paulo',
  },
} satisfies Record<string, ProposalDocument['branding']>;

function build(
  template: Parameters<typeof documentFromTemplate>[0],
  overrides: (document: ProposalDocument) => ProposalDocument,
): ProposalDocument {
  return overrides(documentFromTemplate(template, '2026-09-20'));
}

export const EXAMPLE_PROPOSALS: readonly ExampleProposal[] = [
  {
    status: 'sent',
    daysAgo: 2,
    document: build('web-app', (document) => ({
      ...document,
      title: 'B2B ordering portal for Brightwater Supply',
      client: {
        company: 'Brightwater Supply Co.',
        contactName: 'Dana Whitlock',
        email: 'dana.whitlock@brightwater.folderit.net',
        address: '1200 Harbor Avenue, Seattle, WA',
        notes: 'Prefers a fixed price per phase.',
      },
      project: {
        ...document.project,
        name: 'Brightwater ordering portal',
        startDate: '2026-11-02',
      },
      branding: STUDIOS.halden,
    })),
  },
  {
    status: 'accepted',
    daysAgo: 9,
    document: build('mobile-app', (document) => ({
      ...document,
      title: 'Inspection app for Northfield Utilities',
      client: {
        company: 'Northfield Utilities',
        contactName: 'Marcus Feld',
        email: 'm.feld@northfield.folderit.net',
        address: '55 Grid Street, Calgary, AB',
        notes: '',
      },
      project: { ...document.project, name: 'Field inspection app', startDate: '2026-10-12' },
      pricing: {
        currency: 'CAD',
        discountType: 'percent',
        discountValue: 500,
        taxRateBps: 500,
        taxLabel: 'GST',
      },
      branding: STUDIOS.ostrander,
    })),
  },
  {
    status: 'draft',
    daysAgo: 1,
    document: build('retainer', (document) => ({
      ...document,
      title: 'Platform retainer for Larkspur Payments',
      client: {
        company: 'Larkspur Payments',
        contactName: 'Priya Natarajan',
        email: 'priya@larkspur.folderit.net',
        address: '',
        notes: 'Wants the retainer to start before the year-end freeze.',
      },
      branding: STUDIOS.halden,
    })),
  },
  {
    status: 'sent',
    daysAgo: 5,
    document: build('web-app', (document) => ({
      ...document,
      title: 'Booking platform redesign',
      client: {
        company: 'Moorgate Clinics',
        contactName: 'Eleanor Hughes',
        email: 'e.hughes@moorgate.folderit.net',
        address: '7 Kingsway, Manchester',
        notes: '',
      },
      project: {
        name: 'Patient booking platform',
        summary:
          'A redesign of the online booking flow with accessible forms and automated reminders.',
        objectives: ['Cut booking abandonment', 'Meet WCAG 2.2 AA'],
        startDate: '2026-11-16',
        durationWeeks: 10,
      },
      scope: [
        {
          name: 'Accessibility audit',
          description: 'WCAG 2.2 AA review of the current booking flow.',
          included: true,
          notes: '',
        },
        {
          name: 'Booking flow',
          description: 'Clinic, practitioner and slot selection with accessible forms.',
          included: true,
          notes: '',
        },
        {
          name: 'Reminders',
          description: 'Email and SMS reminders with one-tap rescheduling.',
          included: true,
          notes: '',
        },
        {
          name: 'Payments',
          description: 'Deposits for private appointments.',
          included: false,
          notes: 'Out of scope until the payments provider is chosen.',
        },
      ],
      lineItems: [
        {
          service: 'Accessibility audit',
          description: 'Audit of the current flow with a remediation plan.',
          unit: 'fixed',
          quantity: 1,
          unitPriceMinor: 480_000,
        },
        {
          service: 'UX/UI design',
          description: 'Booking, reminders and account screens.',
          unit: 'day',
          quantity: 12,
          unitPriceMinor: 65_000,
        },
        {
          service: 'Frontend development',
          description: 'Next.js implementation with tests.',
          unit: 'day',
          quantity: 30,
          unitPriceMinor: 60_000,
        },
      ],
      pricing: {
        currency: 'GBP',
        discountType: 'none',
        discountValue: 0,
        taxRateBps: 2_000,
        taxLabel: 'VAT',
      },
      terms: {
        ...document.terms,
        paymentTerms: 'Net 30 from each invoice',
        milestones: [
          { name: 'Audit delivered', due: 'Week 2', percentBps: 2_500 },
          { name: 'Design sign-off', due: 'Week 5', percentBps: 3_500 },
          { name: 'Go-live', due: 'Week 10', percentBps: 4_000 },
        ],
      },
      branding: STUDIOS.tessera,
    })),
  },
  {
    status: 'declined',
    daysAgo: 21,
    document: build('web-app', (document) => ({
      ...document,
      title: 'Warehouse dashboard for Copperline Logistics',
      client: {
        company: 'Copperline Logistics',
        contactName: 'Tomás Reyes',
        email: 'treyes@copperline.folderit.net',
        address: 'Av. Insurgentes 410, Ciudad de México',
        notes: 'Budget was moved to the next fiscal year.',
      },
      project: { ...document.project, name: 'Warehouse operations dashboard', durationWeeks: 8 },
      lineItems: document.lineItems.map((item) => ({ ...item, unitPriceMinor: 52_000 })),
      pricing: {
        currency: 'MXN',
        discountType: 'fixed',
        discountValue: 1_500_000,
        taxRateBps: 1_600,
        taxLabel: 'IVA',
      },
      branding: STUDIOS.ostrander,
    })),
  },
  {
    status: 'accepted',
    daysAgo: 30,
    document: build('mobile-app', (document) => ({
      ...document,
      title: 'Loyalty app for Pinecrest Coffee',
      client: {
        company: 'Pinecrest Coffee Roasters',
        contactName: 'Lucas Andrade',
        email: 'lucas@pinecrest.folderit.net',
        address: 'Rua Augusta 1520, São Paulo',
        notes: '',
      },
      project: { ...document.project, name: 'Pinecrest loyalty app', durationWeeks: 14 },
      lineItems: document.lineItems.map((item) => ({
        ...item,
        unitPriceMinor: Math.round(item.unitPriceMinor * 2.4),
      })),
      pricing: {
        currency: 'BRL',
        discountType: 'none',
        discountValue: 0,
        taxRateBps: 0,
        taxLabel: 'Tax',
      },
      branding: STUDIOS.quillon,
    })),
  },
  {
    status: 'draft',
    daysAgo: 0,
    document: build('web-app', (document) => ({
      ...document,
      title: 'Internal knowledge base',
      client: {
        company: 'Meridian Grove University',
        contactName: 'Dr. Hannah Ostrowski',
        email: 'h.ostrowski@meridiangrove.folderit.net',
        address: '',
        notes: '',
      },
      project: {
        name: 'Faculty knowledge base',
        summary: 'A searchable knowledge base for faculty policies with role-based access.',
        objectives: ['One place for policies', 'Search that understands synonyms'],
        startDate: null,
        durationWeeks: 6,
      },
      scope: document.scope.slice(0, 3),
      pricing: {
        currency: 'EUR',
        discountType: 'percent',
        discountValue: 1_000,
        taxRateBps: 2_100,
        taxLabel: 'VAT',
      },
      branding: STUDIOS.tessera,
    })),
  },
];
