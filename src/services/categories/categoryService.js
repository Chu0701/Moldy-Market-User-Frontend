import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * Fetches the public category tree.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<unknown>}
 */
export async function getCategoryTree({ signal } = {}) {
  const response = await apiClient.get('/api/v1/categories', {
    signal,
  })

  return unwrap(response)
}
