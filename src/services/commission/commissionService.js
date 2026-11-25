import { apiClient } from '@/services/api/client'

/** @param {{ signal?: AbortSignal }} [options] */
export async function getMyAppraiserCommissions({ signal } = {}) {
  const response = await apiClient.get('/api/v1/appraiser/commissions/my', { signal })
  if (!Array.isArray(response.data)) {
    throw new Error('Expected a raw commission list')
  }
  return response.data
}

/** @param {{ commissionId: string, signal?: AbortSignal }} options */
export async function getMyAppraiserCommission({ commissionId, signal }) {
  const response = await apiClient.get(
    `/api/v1/appraiser/commissions/${encodeURIComponent(commissionId)}`,
    { signal },
  )
  return response.data
}
