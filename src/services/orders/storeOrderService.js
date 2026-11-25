import { apiClient } from '@/services/api/client'
import { ApiError, FRONTEND_ERROR_CODES } from '@/services/api/ApiError'
import { normalizePagedResponse } from '@/services/api/pagination'
import { unwrap } from '@/services/api/unwrap'

/**
 * @param {{
 *   storeId: string,
 *   page?: number,
 *   status?: string,
 *   q?: string,
 *   from?: string,
 *   to?: string,
 *   oldestFirst?: boolean,
 *   signal?: AbortSignal,
 * }} input
 */
export async function getStoreOrders({
  storeId,
  page = 1,
  status,
  q,
  from,
  to,
  oldestFirst = false,
  signal,
}) {
  const trimmedQ = typeof q === 'string' ? q.trim() : ''
  const response = await apiClient.get(
    '/api/v1/stores/' + encodeURIComponent(storeId) + '/orders',
    {
      params: {
        page,
        size: 20,
        ...(status ? { status } : {}),
        ...(trimmedQ ? { q: trimmedQ } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(oldestFirst ? { oldestFirst: true } : {}),
      },
      signal,
    },
  )
  const data = unwrap(response)
  if (
    !Array.isArray(data?.content) ||
    data.page !== page ||
    data.size !== 20 ||
    typeof data.hasNext !== 'boolean' ||
    !Number.isSafeInteger(data.totalElements) ||
    data.totalElements < 0 ||
    data.content.some(
      (order) =>
        !order?.id ||
        order.storeId !== storeId ||
        !Array.isArray(order.items) ||
        ['paymentMethod', 'paymentStatus', 'paidAt'].some(
          (field) => order[field] != null && typeof order[field] !== 'string',
        ),
    )
  ) {
    throw new ApiError({
      status: null,
      code: FRONTEND_ERROR_CODES.UNKNOWN,
      message: 'Invalid store order page',
    })
  }
  return normalizePagedResponse(data)
}

/**
 * Fetches server-side counts grouped by order status for a store.
 * @param {{ storeId: string, signal?: AbortSignal }} input
 * @returns {Promise<{ total: number, counts: Record<string, number> }>}
 */
export async function getStoreOrderSummary({ storeId, signal }) {
  const response = await apiClient.get(
    '/api/v1/stores/' + encodeURIComponent(storeId) + '/orders/summary',
    { signal },
  )
  const data = unwrap(response)
  return {
    total: Number(data?.total ?? 0),
    counts: data?.counts && typeof data.counts === 'object' ? data.counts : {},
  }
}

/** @param {{ orderId: string }} input Only the store owner can confirm COD. */
export async function confirmStoreOrder({ orderId }) {
  const response = await apiClient.post(
    '/api/v1/orders/seller/' + encodeURIComponent(orderId) + '/confirm',
  )
  return unwrap(response)
}
