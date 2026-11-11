import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'
import { normalizeProductSearchPage } from '@/services/api/pagination'
/**
 * Searches public products.
 * @param {{
 *   q?: string,
 *   page?: number,
 *   size?: number,
 *   sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc',
 *   signal?: AbortSignal
 * }} [options]
 * @returns {Promise<unknown>}
 */
export async function searchProducts({ q, page = 1, size = 8, sort = 'newest', signal } = {}) {
  const response = await apiClient.get('/api/v1/products/search', {
    params: {
      q,
      page,
      size,
      sort,
    },
    signal,
  })

  return normalizeProductSearchPage(unwrap(response))
}
