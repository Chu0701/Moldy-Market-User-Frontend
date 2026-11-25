import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { appraiserKeys } from '@/features/appraiser/appraiserKeys'
import {
  acceptAppraisalInvitation,
  applyToAppraisalRequest,
  cancelAppraisalAssignment,
  getAppraisalApplication,
  getAppraisalAssignment,
  getAppraisalInvitation,
  getAppraisalReportHistory,
  getAppraisalRequest,
  getAppraiserReviews,
  getMyAppraisalApplications,
  getMyAppraisalAssignments,
  getMyAppraisalInvitations,
  getOpenAppraisalRequests,
  rejectAppraisalInvitation,
  startAppraisalAssignment,
  submitAppraisalReport,
  withdrawAppraisalApplication,
} from '@/services/appraisal/appraisalService'
import {
  deactivateMyAppraiserProfile,
  getMyAppraiserProfile,
  getMyAppraiserStatus,
  reactivateMyAppraiserProfile,
  registerAsAppraiser,
  updateMyAppraiserProfile,
} from '@/services/appraiser/appraiserService'
import {
  getMyAppraiserCommission,
  getMyAppraiserCommissions,
} from '@/services/commission/commissionService'

export function useMyAppraiserProfile(userId) {
  return useQuery({
    queryKey: appraiserKeys.profile(userId),
    queryFn: userId ? ({ signal }) => getMyAppraiserProfile({ signal }) : skipToken,
    retry: false,
  })
}

export function useMyAppraiserStatus(userId, enabled = true) {
  return useQuery({
    queryKey: appraiserKeys.status(userId),
    queryFn: userId ? ({ signal }) => getMyAppraiserStatus({ signal }) : skipToken,
    enabled: Boolean(userId) && enabled,
    retry: false,
  })
}

export function useOpenAppraisalRequests(userId, page = 1, enabled = true) {
  return useQuery({
    queryKey: appraiserKeys.openRequests(userId, page),
    queryFn: userId ? ({ signal }) => getOpenAppraisalRequests({ page, signal }) : skipToken,
    enabled,
    retry: false,
  })
}

export function useAppraisalRequest(userId, requestId) {
  return useQuery({
    queryKey: appraiserKeys.request(userId, requestId),
    queryFn:
      userId && requestId ? ({ signal }) => getAppraisalRequest({ requestId, signal }) : skipToken,
    retry: false,
  })
}

export function useMyAppraisalApplications(userId, page = 1) {
  return useQuery({
    queryKey: appraiserKeys.applications(userId, page),
    queryFn: userId ? ({ signal }) => getMyAppraisalApplications({ page, signal }) : skipToken,
    retry: false,
  })
}

export function useAppraisalApplication(userId, applicationId) {
  return useQuery({
    queryKey: ['appraiser', userId, 'application', applicationId],
    queryFn:
      userId && applicationId
        ? ({ signal }) => getAppraisalApplication({ applicationId, signal })
        : skipToken,
    retry: false,
  })
}

export function useMyAppraisalInvitations(userId, page = 1) {
  return useQuery({
    queryKey: appraiserKeys.invitations(userId, page),
    queryFn: userId ? ({ signal }) => getMyAppraisalInvitations({ page, signal }) : skipToken,
    retry: false,
  })
}

export function useAppraisalInvitation(userId, invitationId) {
  return useQuery({
    queryKey: ['appraiser', userId, 'invitation', invitationId],
    queryFn:
      userId && invitationId
        ? ({ signal }) => getAppraisalInvitation({ invitationId, signal })
        : skipToken,
    retry: false,
  })
}

export function useMyAppraisalAssignments(userId, page = 1) {
  return useQuery({
    queryKey: appraiserKeys.assignments(userId, page),
    queryFn: userId ? ({ signal }) => getMyAppraisalAssignments({ page, signal }) : skipToken,
    retry: false,
  })
}

export function useAppraisalAssignment(userId, assignmentId) {
  return useQuery({
    queryKey: appraiserKeys.assignment(userId, assignmentId),
    queryFn:
      userId && assignmentId
        ? ({ signal }) => getAppraisalAssignment({ assignmentId, signal })
        : skipToken,
    retry: false,
  })
}

export function useAppraisalReportHistory(userId, assignmentId, enabled = true) {
  return useQuery({
    queryKey: appraiserKeys.reports(userId, assignmentId),
    queryFn:
      userId && assignmentId
        ? ({ signal }) => getAppraisalReportHistory({ assignmentId, signal })
        : skipToken,
    enabled: Boolean(userId && assignmentId) && enabled,
    retry: false,
  })
}

export function useAppraiserReviews(userId, appraiserId, page = 1) {
  return useQuery({
    queryKey: appraiserKeys.reviews(userId, appraiserId, page),
    queryFn:
      userId && appraiserId
        ? ({ signal }) => getAppraiserReviews({ appraiserId, page, signal })
        : skipToken,
    retry: false,
  })
}

export function useMyAppraiserCommissions(userId) {
  return useQuery({
    queryKey: appraiserKeys.commissions(userId),
    queryFn: userId ? ({ signal }) => getMyAppraiserCommissions({ signal }) : skipToken,
    retry: false,
  })
}

export function useMyAppraiserCommission(userId, commissionId) {
  return useQuery({
    queryKey: appraiserKeys.commission(userId, commissionId),
    queryFn:
      userId && commissionId
        ? ({ signal }) => getMyAppraiserCommission({ commissionId, signal })
        : skipToken,
    retry: false,
  })
}

export function useRegisterAsAppraiser(userId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: registerAsAppraiser,
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appraiserKeys.profile(userId) }),
        queryClient.invalidateQueries({ queryKey: appraiserKeys.status(userId) }),
      ])
    },
  })
}

export function useUpdateMyAppraiserProfile(userId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMyAppraiserProfile,
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appraiserKeys.profile(userId) }),
        queryClient.invalidateQueries({ queryKey: appraiserKeys.status(userId) }),
      ])
    },
  })
}

export function useDeactivateMyAppraiserProfile(userId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deactivateMyAppraiserProfile,
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appraiserKeys.profile(userId) }),
        queryClient.invalidateQueries({ queryKey: appraiserKeys.status(userId) }),
      ])
    },
  })
}

export function useReactivateMyAppraiserProfile(userId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reactivateMyAppraiserProfile,
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appraiserKeys.profile(userId) }),
        queryClient.invalidateQueries({ queryKey: appraiserKeys.status(userId) }),
      ])
    },
  })
}

export function useApplyToAppraisalRequest(userId, requestId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => applyToAppraisalRequest({ requestId, payload }),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appraiser', userId, 'applications'] }),
        queryClient.invalidateQueries({ queryKey: ['appraiser', userId, 'open-requests'] }),
      ])
    },
  })
}

export function useWithdrawAppraisalApplication(userId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: withdrawAppraisalApplication,
    retry: false,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ['appraiser', userId, 'applications'] }),
  })
}

function useInvitationAction(userId, mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appraiser', userId, 'invitations'] }),
        queryClient.invalidateQueries({ queryKey: ['appraiser', userId, 'assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['appraiser', userId, 'open-requests'] }),
      ])
    },
  })
}

export function useAcceptAppraisalInvitation(userId) {
  return useInvitationAction(userId, acceptAppraisalInvitation)
}

export function useRejectAppraisalInvitation(userId) {
  return useInvitationAction(userId, rejectAppraisalInvitation)
}

export function useStartAppraisalAssignment(userId, assignmentId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => startAppraisalAssignment({ assignmentId }),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appraiserKeys.assignment(userId, assignmentId) }),
        queryClient.invalidateQueries({ queryKey: ['appraiser', userId, 'assignments'] }),
      ])
    },
  })
}

export function useCancelAppraisalAssignment(userId, assignmentId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cancelAppraisalAssignment({ assignmentId }),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appraiserKeys.assignment(userId, assignmentId) }),
        queryClient.invalidateQueries({ queryKey: ['appraiser', userId, 'assignments'] }),
      ])
    },
  })
}

export function useSubmitAppraisalReport(userId, assignmentId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => submitAppraisalReport({ assignmentId, payload }),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appraiserKeys.reports(userId, assignmentId) }),
        queryClient.invalidateQueries({ queryKey: appraiserKeys.assignment(userId, assignmentId) }),
      ])
    },
  })
}
