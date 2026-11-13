import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'
import { normalizeProductSearchPage } from '@/services/api/pagination'
/**
 * Searches public products.
 * @param {{
 *   q?: string,
 *   storeId?: string,
 *   page?: number,
 *   size?: number,
 *   sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc',
 *   signal?: AbortSignal,
 *   categoryId?: string,
 *   condition?: string[],
 *   minPrice?: number,
 *   maxPrice?: number,
 * }} [options]
 * @returns {Promise<unknown>}
 */
export async function searchProducts({
  q,
  storeId,
  categoryId,
  condition,
  minPrice,
  maxPrice,
  page = 1,
  size = 8,
  sort = 'newest',
  signal,
} = {}) {
  const response = await apiClient.get('/api/v1/products/search', {
    params: {
      q,
      storeId,
      categoryId,
      condition,
      minPrice,
      maxPrice,
      page,
      size,
      sort,
    },
    paramsSerializer: { indexes: null },
    signal,
  })

  return normalizeProductSearchPage(unwrap(response))
}

/**
 * Fetches one public product by ID.
 * @param {{ productId: string, signal?: AbortSignal }} options
 * @returns {Promise<unknown>}
 */
export async function getProductById({ productId, signal }) {
  const response = await apiClient.get(`/api/v1/products/${encodeURIComponent(productId)}`, {
    signal,
  })

  return unwrap(response)
}
