import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * @typedef {{
 *  id: string,
 *  name: string,
 *  description: string | null,
 *  createdAt: string
 * }} PublicStore
 */

/**
 * @param {{ storeId: string, signal?: AbortSignal }} options
 * @returns {Promise<PublicStore | undefined>}
 */

export async function getPublicStore({ storeId, signal }) {
  const response = await apiClient.get(`/api/v1/stores/${encodeURIComponent(storeId)}`, {
    signal,
  })

  return unwrap(response)
}
