import { useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/useSession'
import { analyticsKeys } from '@/features/analytics/analyticsKeys'
import {
  getProductPriceHistory,
  getSellerOverview,
  getSellerRevenueChart,
  getSellerTopProducts,
} from '@/services/analytics/analyticsService'

/**
 * Loads seller overview, revenue series, and top products for the current user.
 * @param {{ from?: string, to?: string, limit?: number }} [options]
 */
export function useSellerAnalytics({ from = '', to = '', limit = 5 } = {}) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  const overviewQuery = useQuery({
    queryKey: analyticsKeys.sellerOverview(userId),
    queryFn: ({ signal }) => getSellerOverview({ signal }),
    enabled: Boolean(userId),
  })

  const revenueQuery = useQuery({
    queryKey: analyticsKeys.sellerRevenue(userId, from, to),
    queryFn: ({ signal }) =>
      getSellerRevenueChart({ from: from || undefined, to: to || undefined, signal }),
    enabled: Boolean(userId),
  })

  const topProductsQuery = useQuery({
    queryKey: analyticsKeys.sellerTopProducts(userId, limit),
    queryFn: ({ signal }) => getSellerTopProducts({ limit, signal }),
    enabled: Boolean(userId),
  })

  return {
    userId,
    profileQuery,
    overviewQuery,
    revenueQuery,
    topProductsQuery,
  }
}

/**
 * Loads buyer-facing price change history for a product (authenticated only).
 * @param {string | undefined} productId
 */
export function useProductPriceHistory(productId) {
  const { hasAccessToken, profileQuery } = useSession()
  const userId = hasAccessToken ? profileQuery.data?.id : undefined

  return useQuery({
    queryKey: analyticsKeys.priceHistory(userId, productId),
    queryFn: ({ signal }) => getProductPriceHistory({ productId, signal }),
    enabled: Boolean(userId && productId),
    retry: false,
  })
}
