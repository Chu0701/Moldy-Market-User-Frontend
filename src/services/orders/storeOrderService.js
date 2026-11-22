import { apiClient } from '@/services/api/client'
import { ApiError, FRONTEND_ERROR_CODES } from '@/services/api/ApiError'
import { normalizePagedResponse } from '@/services/api/pagination'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ storeId: string, page?: number, status?: string, signal?: AbortSignal }} input */
export async function getStoreOrders({ storeId, page = 1, status, signal }) {
  const response = await apiClient.get(
    '/api/v1/stores/' + encodeURIComponent(storeId) + '/orders',
    {
      params: { page, size: 20, ...(status ? { status } : {}) },
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
      (order) => !order?.id || order.storeId !== storeId || !Array.isArray(order.items),
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

/** @param {{ orderId: string }} input Only the store owner can confirm COD. */
export async function confirmStoreOrder({ orderId }) {
  const response = await apiClient.post(
    '/api/v1/orders/seller/' + encodeURIComponent(orderId) + '/confirm',
  )
  return unwrap(response)
}
