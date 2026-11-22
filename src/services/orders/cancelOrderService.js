import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ orderId: string }} input See doc14 section 5.7.2. */
export async function cancelMyOrder({ orderId }) {
  const response = await apiClient.post(
    '/api/v1/orders/buyer/' + encodeURIComponent(orderId) + '/cancel',
  )
  return unwrap(response)
}
