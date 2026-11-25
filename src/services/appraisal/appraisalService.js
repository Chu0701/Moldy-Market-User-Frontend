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

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getMyAppraisalRequests({ page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisal-requests/my-requests', {
    params: { page, size },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}

/** @param {object} payload */
export async function createAppraisalRequest(payload) {
  return unwrap(await apiClient.post('/api/v1/appraisal-requests', payload))
}

/** @param {{ requestId: string }} options */
export async function cancelAppraisalRequest({ requestId }) {
  return unwrap(
    await apiClient.patch(`/api/v1/appraisal-requests/${encodeURIComponent(requestId)}/cancel`),
  )
}

/** @param {{ requestId: string, page?: number, size?: number, signal?: AbortSignal }} options */
export async function getRequestApplications({ requestId, page = 1, size = 20, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraisal-requests/${encodeURIComponent(requestId)}/applications`,
    { params: { page, size }, signal },
  )
  return normalizeSpringPage(unwrap(response))
}

/** @param {{ requestId: string, payload: object }} options */
export async function createAppraisalInvitation({ requestId, payload }) {
  return unwrap(
    await apiClient.post(
      `/api/v1/appraisal-requests/${encodeURIComponent(requestId)}/invitations`,
      payload,
    ),
  )
}

/** @param {{ requestId: string, page?: number, size?: number, signal?: AbortSignal }} options */
export async function getRequestInvitations({ requestId, page = 1, size = 20, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraisal-requests/${encodeURIComponent(requestId)}/invitations`,
    { params: { page, size }, signal },
  )
  return normalizeSpringPage(unwrap(response))
}

/** @param {{ requestId: string, applicationId: string }} options */
export async function selectAppraiserForRequest({ requestId, applicationId }) {
  return unwrap(
    await apiClient.post(
      '/api/v1/appraisal-assignments/select-appraiser',
      { applicationId },
      { params: { requestId } },
    ),
  )
}

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getSellerAppraisalAssignments({ page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisal-assignments/seller/my-assignments', {
    params: { page, size },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}

/** @param {{ reportId: string, signal?: AbortSignal }} options */
export async function getAppraisalReport({ reportId, signal }) {
  return unwrap(
    await apiClient.get(`/api/v1/appraisal-reports/${encodeURIComponent(reportId)}`, { signal }),
  )
}

/** @param {{ reportId: string }} options */
export async function acceptAppraisalReport({ reportId }) {
  return unwrap(
    await apiClient.patch(`/api/v1/appraisal-reports/${encodeURIComponent(reportId)}/accept`),
  )
}

/** @param {{ reportId: string, rejectionReason: string }} options */
export async function rejectAppraisalReport({ reportId, rejectionReason }) {
  return unwrap(
    await apiClient.patch(`/api/v1/appraisal-reports/${encodeURIComponent(reportId)}/reject`, {
      rejectionReason,
    }),
  )
}

/** @param {{ assignmentId: string, payload: object }} options */
export async function createAppraisalReview({ assignmentId, payload }) {
  return unwrap(
    await apiClient.post(
      `/api/v1/appraisal-reviews/assignments/${encodeURIComponent(assignmentId)}`,
      payload,
    ),
  )
}

/** @param {{ assignmentId: string, signal?: AbortSignal }} options */
export async function getAssignmentReview({ assignmentId, signal }) {
  return unwrap(
    await apiClient.get(
      `/api/v1/appraisal-reviews/assignments/${encodeURIComponent(assignmentId)}`,
      { signal },
    ),
  )
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

/** @param {{ invitationId: string }} options */
export async function cancelAppraisalInvitation({ invitationId }) {
  return unwrap(
    await apiClient.patch(
      `/api/v1/appraisal-invitations/${encodeURIComponent(invitationId)}/cancel`,
    ),
  )
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
