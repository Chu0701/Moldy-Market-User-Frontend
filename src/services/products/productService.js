import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'
import { normalizePagedResponse, normalizeProductSearchPage } from '@/services/api/pagination'
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
  facets,
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
      ...(facets ? { facets: true } : {}),
    },
    paramsSerializer: { indexes: null },
    signal,
  })

  return normalizeProductSearchPage(unwrap(response))
}

/**
 * Fetches live product title autocomplete suggestions (Backend requires >= 3 characters).
 * @param {{ q: string, signal?: AbortSignal }} options
 * @returns {Promise<string[]>}
 */
export async function suggestProducts({ q, signal }) {
  const response = await apiClient.get('/api/v1/products/suggest', {
    params: { q },
    signal,
  })

  const data = unwrap(response)
  return Array.isArray(data) ? data.filter((item) => typeof item === 'string' && item.trim()) : []
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

/**
 * @param {{
 *  storeId: string,
 *  categoryId: string,
 *  title:string,
 *  description?:string,
 *  price:number,
 *  condition:'NEW'|'LIKE_NEW'|'USED'|'DAMAGED',
 *  imageFileIds?:string[],
 * }} product
 */
export async function createStoreProduct({
  storeId,
  categoryId,
  title,
  description,
  price,
  condition,
  allowOffer = true,
  imageFileIds = [],
}) {
  if (!storeId) throw new Error('Creating a product requires a store ID')

  const response = await apiClient.post('/api/v1/products', {
    storeId,
    categoryId,
    title,
    description: description ?? '',
    price,
    condition,
    pricingStrategy: 'SELLER_SET',
    allowOffer,
    imageFileIds: Array.isArray(imageFileIds) ? imageFileIds.slice(0, 10) : [],
  })

  return unwrap(response)
}

/**
 * @param {{ productId: string, version: number, title?: string, description?: string,
 *   price?: number, condition?: string, attributes?: Record<string, unknown>,
 *   imageFileIds?: string[] }} product
 */
export async function updateProduct({ productId, version, ...changes }) {
  const response = await apiClient.put(`/api/v1/products/${encodeURIComponent(productId)}`, {
    version,
    ...changes,
  })

  return unwrap(response)
}
/** @param {{ productId: string, status: 'ACTIVE' | 'HIDDEN' }} options */
export async function changeProductStatus({ productId, status }) {
  const response = await apiClient.patch(
    `/api/v1/products/${encodeURIComponent(productId)}/status`,
    undefined,
    { params: { status } },
  )

  unwrap(response)
}

/** @param {{ productId: string }} options */
export async function deleteProduct({ productId }) {
  await apiClient.delete(`/api/v1/products/${encodeURIComponent(productId)}`)
}

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getMyProducts({ page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/products/me', {
    params: { page, size },
    signal,
  })

  return normalizePagedResponse(unwrap(response))
}

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [options] */
export async function getMyStoreProducts({ page = 1, size = 20, signal } = {}) {
  const response = await apiClient.get('/api/v1/stores/my-store/products', {
    params: { page, size },
    signal,
  })

  return normalizePagedResponse(unwrap(response))
}

/** @param {{ storeId: string, page?: number, size?: number, signal?: AbortSignal }} options */
export async function getStoreProducts({ storeId, page = 1, size = 20, signal }) {
  const response = await apiClient.get(`/api/v1/stores/${encodeURIComponent(storeId)}/products`, {
    params: { page, size },
    signal,
  })
  return normalizePagedResponse(unwrap(response))
}
