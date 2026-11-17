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

/**
 * @param {{
 *  storeId: string,
 *  categoryId: string,
 *  title:string,
 *  description?:string,
 *  price:number,
 *  condition:'NEW'|'LIKE_NEW'|'USED'|'DAMAGED',
 *  images?:string[],
 * }} product
 */
export async function createStoreProduct({
  storeId,
  categoryId,
  title,
  description,
  price,
  condition,
  images,
}) {
  if (!storeId) throw new Error('Creating a product requires a store ID')

  const response = await apiClient.post('/api/v1/products', {
    storeId,
    categoryId,
    title,
    description,
    price,
    condition,
    pricingStrategy: 'SELLER_SET',
    images,
  })

  return unwrap(response)
}

/**
 * @param {{
 *   productId: string,
 *   version: number,
 *   title: string,
 *   description: string,
 *   price: number,
 *   condition: 'NEW' | 'LIKE_NEW' | 'USED' | 'DAMAGED',
 *   images: string[],
 * }} product
 */
export async function updateProduct({
  productId,
  version,
  title,
  description,
  price,
  condition,
  images,
}) {
  const response = await apiClient.put(`/api/v1/products/${encodeURIComponent(productId)}`, {
    version,
    title,
    description,
    price,
    condition,
    images,
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
