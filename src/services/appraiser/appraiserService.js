import { apiClient } from '@/services/api/client'
import { normalizeSpringPage } from '@/services/api/pagination'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ bio: string, categoryIds: string[], avatarUrl?: string }} payload */
export async function registerAsAppraiser(payload) {
  const response = await apiClient.post('/api/v1/appraisers/register', payload)
  return unwrap(response)
}

/** @param {{ signal?: AbortSignal }} [options] */
export async function getMyAppraiserProfile({ signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisers/me', { signal })
  return unwrap(response)
}

/** @param {{ bio?: string, categoryIds: string[], avatarUrl?: string }} payload */
export async function updateMyAppraiserProfile(payload) {
  const response = await apiClient.put('/api/v1/appraisers/me', payload)
  return unwrap(response)
}

/** @param {{ signal?: AbortSignal }} [options] */
export async function getMyAppraiserStatus({ signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisers/me/status', { signal })
  return unwrap(response)
}

/** @param {{ signal?: AbortSignal }} [options] */
export async function deactivateMyAppraiserProfile({ signal } = {}) {
  const response = await apiClient.patch('/api/v1/appraisers/me/deactivate', undefined, { signal })
  return unwrap(response)
}

/** @param {{ signal?: AbortSignal }} [options] */
export async function reactivateMyAppraiserProfile({ signal } = {}) {
  const response = await apiClient.patch('/api/v1/appraisers/me/reactivate', undefined, { signal })
  return unwrap(response)
}

/** @param {{ categoryId?: string, page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getActiveAppraisers({ categoryId, page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/appraisers/active', {
    params: { categoryId, page, size },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}

/** @param {{ appraiserId: string, signal?: AbortSignal }} options */
export async function getPublicAppraiserProfile({ appraiserId, signal }) {
  const response = await apiClient.get(`/api/v1/appraisers/${encodeURIComponent(appraiserId)}`, {
    signal,
  })
  return unwrap(response)
}
