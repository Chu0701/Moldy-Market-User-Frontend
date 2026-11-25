import { apiClient } from '@/services/api/client'
import { normalizeSpringPage } from '@/services/api/pagination'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getOpenAppraisalRequests({ page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisal-requests/market/open', {
    params: { page, size },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}

/** @param {{ requestId: string, signal?: AbortSignal }} options */
export async function getAppraisalRequest({ requestId, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraisal-requests/${encodeURIComponent(requestId)}`,
    { signal },
  )
  return unwrap(response)
}

/** @param {{ requestId: string, payload: object }} options */
export async function applyToAppraisalRequest({ requestId, payload }) {
  const response = await apiClient.post(
    `/api/v1/appraisal-requests/${encodeURIComponent(requestId)}/applications`,
    payload,
  )
  return unwrap(response)
}

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getMyAppraisalApplications({ page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisal-applications/my-applications', {
    params: { page, size },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}

/** @param {{ applicationId: string, signal?: AbortSignal }} options */
export async function getAppraisalApplication({ applicationId, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraisal-applications/${encodeURIComponent(applicationId)}`,
    { signal },
  )
  return unwrap(response)
}

/** @param {{ applicationId: string }} options */
export async function withdrawAppraisalApplication({ applicationId }) {
  const response = await apiClient.patch(
    `/api/v1/appraisal-applications/${encodeURIComponent(applicationId)}/withdraw`,
  )
  return unwrap(response)
}

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getMyAppraisalInvitations({ page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisal-invitations/my-invitations', {
    params: { page, size },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}

/** @param {{ invitationId: string, signal?: AbortSignal }} options */
export async function getAppraisalInvitation({ invitationId, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraisal-invitations/${encodeURIComponent(invitationId)}`,
    { signal },
  )
  return unwrap(response)
}

/** @param {{ invitationId: string }} options */
export async function acceptAppraisalInvitation({ invitationId }) {
  const response = await apiClient.patch(
    `/api/v1/appraisal-invitations/${encodeURIComponent(invitationId)}/accept`,
  )
  return unwrap(response)
}

/** @param {{ invitationId: string }} options */
export async function rejectAppraisalInvitation({ invitationId }) {
  const response = await apiClient.patch(
    `/api/v1/appraisal-invitations/${encodeURIComponent(invitationId)}/reject`,
  )
  return unwrap(response)
}

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getMyAppraisalAssignments({ page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisal-assignments/my-assignments', {
    params: { page, size },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}

/** @param {{ assignmentId: string, signal?: AbortSignal }} options */
export async function getAppraisalAssignment({ assignmentId, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraisal-assignments/${encodeURIComponent(assignmentId)}`,
    { signal },
  )
  return unwrap(response)
}

/** @param {{ assignmentId: string }} options */
export async function startAppraisalAssignment({ assignmentId }) {
  const response = await apiClient.patch(
    `/api/v1/appraisal-assignments/${encodeURIComponent(assignmentId)}/start`,
  )
  return unwrap(response)
}

/** @param {{ assignmentId: string }} options */
export async function cancelAppraisalAssignment({ assignmentId }) {
  const response = await apiClient.patch(
    `/api/v1/appraisal-assignments/${encodeURIComponent(assignmentId)}/cancel`,
  )
  return unwrap(response)
}

/** @param {{ assignmentId: string, signal?: AbortSignal }} options */
export async function getAppraisalReportHistory({ assignmentId, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraisal-reports/assignments/${encodeURIComponent(assignmentId)}/history`,
    { signal },
  )
  return unwrap(response)
}

/** @param {{ assignmentId: string, payload: object }} options */
export async function submitAppraisalReport({ assignmentId, payload }) {
  const response = await apiClient.post(
    `/api/v1/appraisal-reports/assignments/${encodeURIComponent(assignmentId)}`,
    payload,
  )
  return unwrap(response)
}

/** @param {{ appraiserId: string, page?: number, size?: number, signal?: AbortSignal }} options */
export async function getAppraiserReviews({ appraiserId, page = 1, size = 20, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraisal-reviews/appraisers/${encodeURIComponent(appraiserId)}`,
    { params: { page, size }, signal },
  )
  return normalizeSpringPage(unwrap(response))
}
