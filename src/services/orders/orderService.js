import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ signal?: AbortSignal }} [options] See doc14 section 5.7. */
export async function getMyOrders({ signal } = {}) {
  try {
    const response = await apiClient.get('/api/v1/orders/me', { signal })
    return unwrap(response)
  } catch (error) {
    if (error?.status === 404 && error.code === 'ORDER_LIST_NOT_FOUND') {
      return []
    }
    throw error
  }
}

/** @param {{ orderId: string }} input */
export async function confirmOrderReceived({ orderId }) {
  const response = await apiClient.post(
    '/api/v1/orders/buyer/' + encodeURIComponent(orderId) + '/confirm-received',
  )
  return unwrap(response)
}
