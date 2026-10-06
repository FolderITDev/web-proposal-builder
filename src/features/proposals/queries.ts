import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';

import { ApiError, apiDelete, apiRequest } from '@/lib/api/client';
import {
  type ListProposalsQuery,
  type Proposal,
  type ProposalList,
  ProposalListSchema,
  ProposalSchema,
  type Template,
  type UpdateProposal,
} from '@/lib/validation/proposal';

export const proposalKeys = {
  all: ['proposals'] as const,
  lists: () => [...proposalKeys.all, 'list'] as const,
  list: (query: ListProposalsQuery) => [...proposalKeys.lists(), query] as const,
  detail: (id: string) => [...proposalKeys.all, 'detail', id] as const,
};

export function toSearchParams(query: ListProposalsQuery): URLSearchParams {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sort: query.sort,
  });
  if (query.status) params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  return params;
}

export function proposalsQuery(query: ListProposalsQuery) {
  return queryOptions({
    queryKey: proposalKeys.list(query),
    queryFn: ({ signal }) =>
      apiRequest(`/proposals?${toSearchParams(query)}`, ProposalListSchema, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function proposalQuery(id: string) {
  return queryOptions({
    queryKey: proposalKeys.detail(id),
    queryFn: ({ signal }) =>
      apiRequest(`/proposals/${encodeURIComponent(id)}`, ProposalSchema, { signal }),
    // The editor owns the document while it is open; a background refetch would fight the form.
    staleTime: Infinity,
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}

export function createProposal(template: Template): Promise<Proposal> {
  return apiRequest('/proposals', ProposalSchema, { method: 'POST', body: { template } });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProposal,
    onSuccess: (proposal) => {
      queryClient.setQueryData(proposalKeys.detail(proposal.id), proposal);
      return queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
    },
  });
}

export function useDuplicateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/proposals/${encodeURIComponent(id)}/duplicate`, ProposalSchema, {
        method: 'POST',
      }),
    onSuccess: (proposal) => {
      queryClient.setQueryData(proposalKeys.detail(proposal.id), proposal);
      return queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
    },
  });
}

/** Saves through PATCH. The response replaces the cached proposal, carrying the new version. */
export function useSaveProposal(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['proposals', 'save', id],
    mutationFn: (body: UpdateProposal) =>
      apiRequest(`/proposals/${encodeURIComponent(id)}`, ProposalSchema, { method: 'PATCH', body }),
    onSuccess: (proposal) => {
      queryClient.setQueryData(proposalKeys.detail(id), proposal);
      void queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
    },
  });
}

/** Removes the proposal from every cached list at once and restores them if the server refuses. */
export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/proposals/${encodeURIComponent(id)}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: proposalKeys.lists() });
      const snapshots = queryClient.getQueriesData<ProposalList>({
        queryKey: proposalKeys.lists(),
      });
      for (const [key, list] of snapshots) {
        if (list) {
          queryClient.setQueryData<ProposalList>(key, {
            ...list,
            items: list.items.filter((item) => item.id !== id),
            total: Math.max(0, list.total - 1),
          });
        }
      }
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      for (const [key, list] of context?.snapshots ?? []) queryClient.setQueryData(key, list);
    },
    onSettled: (_data, _error, id) => {
      queryClient.removeQueries({ queryKey: proposalKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: proposalKeys.lists() });
    },
  });
}
