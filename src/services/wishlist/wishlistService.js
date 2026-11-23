import { apiClient } from '@/services/api/client'
import { normalizeSpringPage } from '@/services/api/pagination'
import { unwrap } from '@/services/api/unwrap'

/**
 * @typedef {{ id: string, productId: string, createdAt: string }} WishlistItem
 */

/**
 * Fetches the authenticated user's wishlist page (Backend expects 0-based page).
 * @param {{ page?: number, size?: number, signal?: AbortSignal }} [options]
 */
export async function getWishlist({ page = 1, size = 20, signal } = {}) {
  const zeroBasedPage = Math.max(0, Number(page) - 1)
  const safeSize = Math.min(Math.max(Number(size) || 20, 1), 50)
  const response = await apiClient.get('/api/v1/wishlists', {
    params: { page: zeroBasedPage, size: safeSize },
    signal,
  })
  return normalizeSpringPage(unwrap(response))
}

/**
 * Adds a product to the authenticated user's wishlist.
 * @param {{ productId: string }} params
 * @returns {Promise<WishlistItem>}
 */
export async function addToWishlist({ productId }) {
  const response = await apiClient.post(`/api/v1/wishlists/${encodeURIComponent(productId)}`)
  return unwrap(response)
}

/**
 * Removes a product from the authenticated user's wishlist.
 * @param {{ productId: string }} params
 */
export async function removeFromWishlist({ productId }) {
  const response = await apiClient.delete(`/api/v1/wishlists/${encodeURIComponent(productId)}`)
  return unwrap(response)
}

/**
 * Checks whether a product is in the authenticated user's wishlist.
 * @param {{ productId: string, signal?: AbortSignal }} params
 * @returns {Promise<boolean>}
 */
export async function checkWishlisted({ productId, signal }) {
  const response = await apiClient.get(`/api/v1/wishlists/check/${encodeURIComponent(productId)}`, {
    signal,
  })
  return Boolean(unwrap(response))
}

/**
 * Fetches total wishlist item count for the authenticated user.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<number>}
 */
export async function getWishlistCount({ signal } = {}) {
  const response = await apiClient.get('/api/v1/wishlists/count', { signal })
  return Number(unwrap(response) ?? 0)
}

/**
 * Fetches how many users wishlisted a product (requires authentication per SecurityConfig).
 * @param {{ productId: string, signal?: AbortSignal }} params
 * @returns {Promise<number>}
 */
export async function getProductWishlistCount({ productId, signal }) {
  const response = await apiClient.get(
    `/api/v1/wishlists/products/${encodeURIComponent(productId)}/count`,
    { signal },
  )
  return Number(unwrap(response) ?? 0)
}
