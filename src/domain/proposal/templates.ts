import { type ProposalDocument, type Template } from '@/lib/validation/proposal';

import { addDays } from './document';

/** Branding of a new proposal until the author fills in their own company details. */
export const DEFAULT_BRANDING: ProposalDocument['branding'] = {
  companyName: 'Your company',
  logo: 'orbit',
  color: '#1c2a44',
  email: '',
  phone: '',
  website: '',
  address: '',
};

const STANDARD_CONDITIONS =
  'Work starts after the deposit is received. Change requests are estimated separately and added to the schedule once approved. Source code and design files are transferred to the client after final payment.';

type TemplateContent = Omit<ProposalDocument, 'branding' | 'terms'> & {
  terms: Omit<ProposalDocument['terms'], 'validUntil'>;
};

const TEMPLATES: Record<Template, TemplateContent> = {
  'web-app': {
    title: 'Customer portal: design and development',
    client: {
      company: 'Client company',
      contactName: '',
      email: '',
      address: '',
      notes: '',
    },
    project: {
      name: 'Customer portal',
      summary:
        'A responsive web application where customers browse the catalog, place orders and follow their status, with an admin dashboard for the operations team.',
      objectives: [
        'Let customers place and track orders without calling the sales team',
        'Give operations one dashboard for orders and inventory',
      ],
      startDate: null,
      durationWeeks: 12,
    },
    scope: [
      {
        name: 'Authentication',
        description: 'Email sign-in, password reset and roles for customers and staff.',
        included: true,
        notes: '',
      },
      {
        name: 'Product catalog',
        description: 'Search, filters and product pages with stock availability.',
        included: true,
        notes: '',
      },
      {
        name: 'Order management',
        description: 'Cart, checkout, order history and status notifications.',
        included: true,
        notes: '',
      },
      {
        name: 'Admin dashboard',
        description: 'Orders, customers and catalog management for staff.',
        included: true,
        notes: '',
      },
      {
        name: 'Offline support',
        description: 'Browsing and drafting orders without a connection.',
        included: false,
        notes: 'Can be quoted as a second phase.',
      },
    ],
    lineItems: [
      {
        service: 'UX/UI design',
        description: 'Flows, wireframes and visual design for all screens.',
        unit: 'hour',
        quantity: 40,
        unitPriceMinor: 3_000,
      },
      {
        service: 'Development',
        description: 'Frontend, API and database, with automated tests.',
        unit: 'hour',
        quantity: 180,
        unitPriceMinor: 3_000,
      },
      {
        service: 'Quality assurance',
        description: 'Test plans, regression and acceptance testing.',
        unit: 'hour',
        quantity: 30,
        unitPriceMinor: 3_000,
      },
    ],
    pricing: {
      currency: 'USD',
      discountType: 'none',
      discountValue: 0,
      taxRateBps: 0,
      taxLabel: 'Tax',
    },
    terms: {
      paymentTerms: 'Net 15 from each invoice',
      milestones: [
        { name: 'Deposit', due: 'On signature', percentBps: 3_000 },
        { name: 'Design approval', due: 'Week 4', percentBps: 3_000 },
        { name: 'Launch', due: 'Week 12', percentBps: 4_000 },
      ],
      notes: '',
      conditions: STANDARD_CONDITIONS,
    },
  },
  'mobile-app': {
    title: 'Field app for iOS and Android',
    client: { company: 'Client company', contactName: '', email: '', address: '', notes: '' },
    project: {
      name: 'Field operations app',
      summary:
        'A cross-platform mobile app for field teams to record visits, capture photos and work offline.',
      objectives: ['Replace paper visit reports', 'Sync reliably over poor connections'],
      startDate: null,
      durationWeeks: 16,
    },
    scope: [
      {
        name: 'Visit checklists',
        description: 'Configurable checklists with notes and photos.',
        included: true,
        notes: '',
      },
      {
        name: 'Offline sync',
        description: 'Local storage with conflict-safe synchronization.',
        included: true,
        notes: '',
      },
      {
        name: 'Back-office web panel',
        description: 'Review submitted visits and export reports.',
        included: true,
        notes: '',
      },
      {
        name: 'Store publication',
        description: 'App Store and Google Play submission.',
        included: true,
        notes: '',
      },
    ],
    lineItems: [
      {
        service: 'Product discovery',
        description: 'Workshops, user flows and technical plan.',
        unit: 'day',
        quantity: 5,
        unitPriceMinor: 120_000,
      },
      {
        service: 'Mobile development',
        description: 'React Native app with offline storage.',
        unit: 'hour',
        quantity: 320,
        unitPriceMinor: 4_500,
      },
      {
        service: 'Web panel',
        description: 'Next.js panel and REST API.',
        unit: 'hour',
        quantity: 120,
        unitPriceMinor: 4_500,
      },
      {
        service: 'Quality assurance',
        description: 'Device testing and release checks.',
        unit: 'hour',
        quantity: 60,
        unitPriceMinor: 3_500,
      },
    ],
    pricing: {
      currency: 'USD',
      discountType: 'percent',
      discountValue: 500,
      taxRateBps: 0,
      taxLabel: 'Tax',
    },
    terms: {
      paymentTerms: 'Net 30 from each invoice',
      milestones: [
        { name: 'Deposit', due: 'On signature', percentBps: 2_500 },
        { name: 'Beta on devices', due: 'Week 10', percentBps: 4_000 },
        { name: 'Store release', due: 'Week 16', percentBps: 3_500 },
      ],
      notes: '',
      conditions: STANDARD_CONDITIONS,
    },
  },
  retainer: {
    title: 'Monthly engineering retainer',
    client: { company: 'Client company', contactName: '', email: '', address: '', notes: '' },
    project: {
      name: 'Product engineering retainer',
      summary:
        'A dedicated part-time team for maintenance, improvements and new features, planned every two weeks.',
      objectives: [
        'Keep the platform secure and up to date',
        'Ship a predictable flow of improvements',
      ],
      startDate: null,
      durationWeeks: 26,
    },
    scope: [
      {
        name: 'Maintenance',
        description: 'Dependency updates, monitoring and incident response.',
        included: true,
        notes: '',
      },
      {
        name: 'Feature work',
        description: 'Prioritized backlog items every sprint.',
        included: true,
        notes: '',
      },
      {
        name: '24/7 on-call',
        description: 'Out-of-hours incident response.',
        included: false,
        notes: 'Available as an add-on.',
      },
    ],
    lineItems: [
      {
        service: 'Senior engineer',
        description: 'Half-time, per week.',
        unit: 'week',
        quantity: 26,
        unitPriceMinor: 160_000,
      },
      {
        service: 'Tech lead',
        description: 'Planning and code review, per week.',
        unit: 'week',
        quantity: 26,
        unitPriceMinor: 60_000,
      },
    ],
    pricing: {
      currency: 'USD',
      discountType: 'none',
      discountValue: 0,
      taxRateBps: 0,
      taxLabel: 'Tax',
    },
    terms: {
      paymentTerms: 'Invoiced monthly, net 15',
      milestones: [],
      notes: '',
      conditions: STANDARD_CONDITIONS,
    },
  },
  blank: {
    title: 'Untitled proposal',
    client: { company: 'Client company', contactName: '', email: '', address: '', notes: '' },
    project: {
      name: 'New project',
      summary: '',
      objectives: [],
      startDate: null,
      durationWeeks: null,
    },
    scope: [],
    lineItems: [],
    pricing: {
      currency: 'USD',
      discountType: 'none',
      discountValue: 0,
      taxRateBps: 0,
      taxLabel: 'Tax',
    },
    terms: { paymentTerms: '', milestones: [], notes: '', conditions: '' },
  },
};

/** A new document from a template, valid for 30 days from `today` (YYYY-MM-DD). */
export function documentFromTemplate(template: Template, today: string): ProposalDocument {
  const content = TEMPLATES[template];
  return {
    ...structuredClone(content),
    terms: { ...structuredClone(content.terms), validUntil: addDays(today, 30) },
    branding: { ...DEFAULT_BRANDING },
  };
}
