import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { appraiserKeys } from '@/features/appraiser/appraiserKeys'
import {
  acceptAppraisalReport,
  cancelAppraisalInvitation,
  cancelAppraisalRequest,
  createAppraisalRequest,
  createAppraisalReview,
  createAppraisalInvitation,
  getAppraisalReportHistory,
  getAssignmentReview,
  getMyAppraisalRequests,
  getRequestApplications,
  getRequestInvitations,
  getSellerAppraisalAssignments,
  rejectAppraisalReport,
  selectAppraiserForRequest,
} from '@/services/appraisal/appraisalService'

const sellerKey = (userId, name, id, page) => ['sellerAppraisals', userId, name, id, page]

export function useSellerRequests(userId, page = 1) {
  return useQuery({
    queryKey: sellerKey(userId, 'requests', null, page),
    queryFn: userId ? ({ signal }) => getMyAppraisalRequests({ page, signal }) : skipToken,
    retry: false,
  })
}

/** Loads request data only after confirming its ID appears in the caller-owned request pages. */
export function useOwnedAppraisalRequest(userId, requestId) {
  return useQuery({
    queryKey: sellerKey(userId, 'ownedRequest', requestId),
    queryFn:
      userId && requestId
        ? async ({ signal }) => {
            let page = 1
            while (page <= 1000) {
              const result = await getMyAppraisalRequests({ page, size: 100, signal })
              const ownRequest = result.items.find((item) => item.id === requestId)
              if (ownRequest) return ownRequest
              if (!result.hasNext) return null
              page += 1
            }
            return null
          }
        : skipToken,
    retry: false,
  })
}

export function useSellerAssignments(userId, page = 1) {
  return useQuery({
    queryKey: sellerKey(userId, 'assignments', null, page),
    queryFn: userId ? ({ signal }) => getSellerAppraisalAssignments({ page, signal }) : skipToken,
    retry: false,
  })
}

export function useRequestApplications(userId, requestId, page = 1) {
  return useQuery({
    queryKey: sellerKey(userId, 'applications', requestId, page),
    queryFn:
      userId && requestId
        ? ({ signal }) => getRequestApplications({ requestId, page, signal })
        : skipToken,
    retry: false,
  })
}

export function useRequestInvitations(userId, requestId, page = 1) {
  return useQuery({
    queryKey: sellerKey(userId, 'invitations', requestId, page),
    queryFn:
      userId && requestId
        ? ({ signal }) => getRequestInvitations({ requestId, page, signal })
        : skipToken,
    retry: false,
  })
}

export function useSellerReportHistory(userId, assignmentId) {
  return useQuery({
    queryKey: appraiserKeys.reports(userId, assignmentId),
    queryFn:
      userId && assignmentId
        ? ({ signal }) => getAppraisalReportHistory({ assignmentId, signal })
        : skipToken,
    retry: false,
  })
}

export function useSellerAssignmentReview(userId, assignmentId) {
  return useQuery({
    queryKey: sellerKey(userId, 'review', assignmentId),
    queryFn:
      userId && assignmentId
        ? ({ signal }) => getAssignmentReview({ assignmentId, signal })
        : skipToken,
    retry: false,
    retryOnMount: false,
  })
}

function useSellerMutation(userId, mutationFn, keys = []) {
  const client = useQueryClient()
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: async () =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['sellerAppraisals', userId] }),
        client.invalidateQueries({ queryKey: ['appraiser', userId, 'assignments'] }),
        ...keys.map((queryKey) => client.invalidateQueries({ queryKey })),
      ]),
  })
}

export function useCreateSellerRequest(userId) {
  return useSellerMutation(userId, createAppraisalRequest)
}
export function useCancelSellerRequest(userId) {
  return useSellerMutation(userId, cancelAppraisalRequest)
}
export function useCreateSellerInvitation(userId) {
  return useSellerMutation(userId, createAppraisalInvitation)
}
export function useCancelSellerInvitation(userId) {
  return useSellerMutation(userId, cancelAppraisalInvitation)
}
export function useSelectRequestAppraiser(userId) {
  return useSellerMutation(userId, selectAppraiserForRequest)
}
export function useAcceptSellerReport(userId) {
  return useSellerMutation(userId, acceptAppraisalReport)
}
export function useRejectSellerReport(userId) {
  return useSellerMutation(userId, rejectAppraisalReport)
}
export function useCreateSellerReview(userId) {
  return useSellerMutation(userId, createAppraisalReview)
}
