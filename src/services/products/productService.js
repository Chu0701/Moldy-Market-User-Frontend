import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * Searches public products.
 * @param {{
 *   page?: number,
 *   size?: number,
 *   sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc',
 *   signal?: AbortSignal
 * }} [options]
 * @returns {Promise<unknown>}
 */
export async function searchProducts({ page = 1, size = 8, sort = 'newest', signal } = {}) {
  const response = await apiClient.get('/api/v1/products/search', {
    params: {
      page,
      size,
      sort,
    },
    signal,
  })

  return unwrap(response)
}
