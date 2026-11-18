import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

export async function getCart({ signal } = {}) {
  const response = await apiClient.get('/api/v1/carts', { signal })
  return unwrap(response)
}

/** @param {{ productId: string }} product */
export async function addCartItem({ productId }) {
  const response = await apiClient.post('/api/v1/carts/items', {
    listingId: productId,
    quantity: 1,
  })

  return unwrap(response)
}

/** @param {{ productId: string }} product */
export async function removeCartItem({ productId }) {
  const response = await apiClient.delete(`/api/v1/carts/items/${encodeURIComponent(productId)}`)

  return unwrap(response)
}
