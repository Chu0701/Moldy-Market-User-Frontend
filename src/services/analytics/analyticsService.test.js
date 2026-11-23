import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import {
  getProductPriceHistory,
  getSellerOverview,
  getSellerRevenueChart,
  getSellerTopProducts,
} from '@/services/analytics/analyticsService'

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls seller analytics and buyer price history endpoints', async () => {
    const signal = new AbortController().signal
    apiClient.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          code: 'SUCCESS',
          data: { totalRevenue: 500000, totalOrders: 2, activeProducts: 3, soldProducts: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          code: 'SUCCESS',
          data: [{ date: '2026-11-20', revenue: 500000, orderCount: 2 }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          code: 'SUCCESS',
          data: [{ productId: 'p-1', productName: 'Camera', totalSold: 2, totalRevenue: 500000 }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          code: 'SUCCESS',
          data: { productId: 'p/1', currentPrice: 400000, history: [] },
        },
      })

    const overview = await getSellerOverview({ signal })
    const revenue = await getSellerRevenueChart({
      from: '2026-11-01',
      to: '2026-11-30',
      signal,
    })
    const top = await getSellerTopProducts({ limit: 5, signal })
    const history = await getProductPriceHistory({ productId: 'p/1', signal })

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/api/v1/analytics/seller/overview', {
      signal,
    })
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/api/v1/analytics/seller/revenue', {
      params: { from: '2026-11-01', to: '2026-11-30' },
      signal,
    })
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/api/v1/analytics/seller/top-products', {
      params: { limit: 5 },
      signal,
    })
    expect(apiClient.get).toHaveBeenNthCalledWith(
      4,
      '/api/v1/analytics/buyer/products/p%2F1/price-history',
      { signal },
    )
    expect(overview.totalOrders).toBe(2)
    expect(revenue).toHaveLength(1)
    expect(top).toHaveLength(1)
    expect(history.currentPrice).toBe(400000)
  })
})
