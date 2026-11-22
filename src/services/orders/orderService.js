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
