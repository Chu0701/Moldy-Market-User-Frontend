import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * @typedef {{ totalRevenue: number, totalOrders: number, activeProducts: number, soldProducts: number }} SellerOverview
 * @typedef {{ date: string, revenue: number, orderCount: number }} RevenuePoint
 * @typedef {{ productId: string, productName: string, totalSold: number, totalRevenue: number }} TopProduct
 * @typedef {{ oldPrice: number, newPrice: number, changedAt: string }} PriceHistoryEntry
 * @typedef {{ productId: string, productName: string, currentPrice: number, history: PriceHistoryEntry[] }} ProductPriceHistory
 */

/** @param {{ signal?: AbortSignal }} [options] @returns {Promise<SellerOverview>} */
export async function getSellerOverview({ signal } = {}) {
  const response = await apiClient.get('/api/v1/analytics/seller/overview', { signal })
  return unwrap(response)
}

/** @param {{ from?: string, to?: string, signal?: AbortSignal }} [options] @returns {Promise<RevenuePoint[]>} */
export async function getSellerRevenueChart({ from, to, signal } = {}) {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  const response = await apiClient.get('/api/v1/analytics/seller/revenue', { params, signal })
  return unwrap(response) ?? []
}

/** @param {{ limit?: number, signal?: AbortSignal }} [options] @returns {Promise<TopProduct[]>} */
export async function getSellerTopProducts({ limit = 5, signal } = {}) {
  const response = await apiClient.get('/api/v1/analytics/seller/top-products', {
    params: { limit },
    signal,
  })
  return unwrap(response) ?? []
}

/**
 * Fetches price change history for a product (requires authentication per SecurityConfig).
 * @param {{ productId: string, signal?: AbortSignal }} params
 * @returns {Promise<ProductPriceHistory>}
 */
export async function getProductPriceHistory({ productId, signal }) {
  const response = await apiClient.get(
    `/api/v1/analytics/buyer/products/${encodeURIComponent(productId)}/price-history`,
    { signal },
  )
  return unwrap(response)
}
