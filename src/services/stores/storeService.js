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

/**
 * @param
 */
export async function getMyStore({ signal } = {}) {
  const response = await apiClient.get('/api/v1/stores/my-store', { signal })

  return unwrap(response)
}

/**
 * @param {{ name: string, description?: string, pickupAddress?: string }} store
 */
export async function createStore({ name, description, pickupAddress }) {
  const response = await apiClient.post('/api/v1/stores', {
    name,
    description,
    pickupAddress,
  })

  return unwrap(response)
}
