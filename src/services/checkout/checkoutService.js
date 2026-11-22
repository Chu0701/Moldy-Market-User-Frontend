import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ productIds: string[], receiverName: string, phoneNumber: string, shippingAddress: string, method: 'COD'|'ONLINE_BANKING', note?: string }} input */
export async function createCheckout({
  productIds,
  receiverName,
  phoneNumber,
  shippingAddress,
  method,
  note,
}) {
  const response = await apiClient.post('/api/v1/checkout-groups', {
    orderItems: productIds.map((productId) => ({ productId })),
    receiverName,
    phoneNumber,
    shippingAddress,
    method,
    note,
  })
  return unwrap(response)
}

export async function getCheckout({ checkoutId, signal }) {
  const response = await apiClient.get(
    '/api/v1/checkout-groups/' + encodeURIComponent(checkoutId),
    { signal },
  )
  return unwrap(response)
}
