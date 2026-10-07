import { z } from 'zod';

import { absoluteUrl, siteConfig } from '@/config/site';
import {
  CreateProposalSchema,
  ProblemSchema,
  PROPOSAL_SORTS,
  ProposalListSchema,
  ProposalSchema,
  ProposalStatusSchema,
  UpdateProposalSchema,
} from '@/lib/validation/proposal';

const ref = (schema: z.ZodType) => {
  const id = z.globalRegistry.get(schema)?.id;
  if (!id) throw new Error('Schemas referenced in the OpenAPI document need a meta id.');
  return { $ref: `#/components/schemas/${id}` };
};

const problem = (description: string) => ({
  description,
  content: { 'application/problem+json': { schema: ref(ProblemSchema) } },
});

const jsonBody = (schema: z.ZodType, description: string) => ({
  description,
  content: { 'application/json': { schema: ref(schema) } },
});

const path = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'string', format: 'uuid' },
});

const pdf = {
  description: 'The proposal as a PDF document.',
  content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
};

/**
 * OpenAPI 3.1 document built from the Zod contracts the handlers validate with, so the
 * documentation cannot describe a shape the API does not send.
 */
export function openApiDocument() {
  const { schemas } = z.toJSONSchema(z.globalRegistry, {
    uri: (id) => `#/components/schemas/${id}`,
    unrepresentable: 'any',
  });

  return {
    openapi: '3.1.0',
    info: {
      title: `${siteConfig.name} API`,
      version: '1.0.0',
      description:
        'REST API of Proposal Builder, built by Folder IT. Amounts are integer minor units; rates and shares are basis points. Saves use optimistic concurrency with a version number.',
      contact: { name: siteConfig.company.name, url: siteConfig.company.url },
      license: { name: 'MIT', identifier: 'MIT' },
    },
    externalDocs: { description: 'Source code', url: siteConfig.repositoryUrl },
    servers: [{ url: absoluteUrl('/api') }],
    tags: [
      { name: 'Proposals', description: 'Create, edit and list proposals.' },
      { name: 'Documents', description: 'PDF export and share links.' },
    ],
    paths: {
      '/proposals': {
        get: {
          tags: ['Proposals'],
          operationId: 'listProposals',
          summary: 'List proposals',
          description:
            'Returns the example proposals plus the ones created from the calling browser session.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ProposalStatusSchema.options },
            },
            {
              name: 'q',
              in: 'query',
              description: 'Search by title, client or number.',
              schema: { type: 'string', maxLength: 80 },
            },
            {
              name: 'sort',
              in: 'query',
              schema: { type: 'string', enum: PROPOSAL_SORTS, default: 'updated-desc' },
            },
          ],
          responses: {
            '200': jsonBody(ProposalListSchema, 'A page of proposals with counts per status.'),
            '422': problem('A query parameter is invalid.'),
          },
        },
        post: {
          tags: ['Proposals'],
          operationId: 'createProposal',
          summary: 'Create a proposal from a template',
          requestBody: {
            required: false,
            content: { 'application/json': { schema: ref(CreateProposalSchema) } },
          },
          responses: {
            '201': jsonBody(ProposalSchema, 'The new draft.'),
            '422': problem('The template is unknown.'),
            '429': problem('Too many proposals created from this client.'),
          },
        },
      },
      '/proposals/{id}': {
        get: {
          tags: ['Proposals'],
          operationId: 'getProposal',
          summary: 'Get a proposal',
          parameters: [path('id', 'Proposal ID.')],
          responses: {
            '200': jsonBody(ProposalSchema, 'The proposal, its document and its totals.'),
            '404': problem('No visible proposal with this ID.'),
          },
        },
        patch: {
          tags: ['Proposals'],
          operationId: 'updateProposal',
          summary: 'Save a proposal',
          description:
            'Send the version you read. The document replaces the stored one; the status must follow draft → sent → accepted or declined.',
          parameters: [path('id', 'Proposal ID.')],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: ref(UpdateProposalSchema) } },
          },
          responses: {
            '200': jsonBody(ProposalSchema, 'The saved proposal with its new version.'),
            '403': problem('Example proposals are read-only.'),
            '404': problem('No visible proposal with this ID.'),
            '409': problem('The proposal changed since you read it.'),
            '422': problem('The document is invalid, or the status change is not allowed.'),
          },
        },
        delete: {
          tags: ['Proposals'],
          operationId: 'deleteProposal',
          summary: 'Delete one of your proposals',
          parameters: [path('id', 'Proposal ID.')],
          responses: {
            '204': { description: 'Deleted.' },
            '403': problem('Example proposals cannot be deleted.'),
            '404': problem('No visible proposal with this ID.'),
          },
        },
      },
      '/proposals/{id}/duplicate': {
        post: {
          tags: ['Proposals'],
          operationId: 'duplicateProposal',
          summary: 'Duplicate a proposal',
          description: 'Copies any visible proposal, including examples, into a new draft you own.',
          parameters: [path('id', 'Proposal ID.')],
          responses: {
            '201': jsonBody(ProposalSchema, 'The copy.'),
            '404': problem('No visible proposal with this ID.'),
            '429': problem('Too many proposals created from this client.'),
          },
        },
      },
      '/proposals/{id}/pdf': {
        get: {
          tags: ['Documents'],
          operationId: 'getProposalPdf',
          summary: 'Download a proposal as PDF',
          parameters: [path('id', 'Proposal ID.')],
          responses: {
            '200': pdf,
            '404': problem('No visible proposal with this ID.'),
            '503': problem('The document renderer is not available; try again later.'),
          },
        },
      },
      '/share/{token}/pdf': {
        get: {
          tags: ['Documents'],
          operationId: 'getSharedPdf',
          summary: 'Download a shared proposal as PDF',
          parameters: [path('token', 'Share token from the proposal.')],
          responses: {
            '200': pdf,
            '404': problem('No proposal with this share token.'),
            '503': problem('The document renderer is not available; try again later.'),
          },
        },
      },
    },
    components: { schemas },
  };
}
