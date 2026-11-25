import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/** @param {{ orderId: string, rating: number, comment?: string }} payload */
export async function createStoreReview({ orderId, rating, comment }) {
  const response = await apiClient.post('/api/v1/reviews', {
    orderId,
    rating,
    comment: comment?.trim() || undefined,
  })
  return unwrap(response)
}

/** @param {{ orderId: string, signal?: AbortSignal }} options */
export async function getOrderReview({ orderId, signal }) {
  const response = await apiClient.get(`/api/v1/reviews/orders/${encodeURIComponent(orderId)}`, {
    signal,
  })
  return unwrap(response)
}

/** @param {{ storeId: string, signal?: AbortSignal }} options */
export async function getStoreReviews({ storeId, signal }) {
  const response = await apiClient.get(`/api/v1/reviews/stores/${encodeURIComponent(storeId)}`, {
    signal,
  })
  return unwrap(response)
}

/** @param {{ reviewId: string, reply: string }} payload */
export async function replyToStoreReview({ reviewId, reply }) {
  const response = await apiClient.post(`/api/v1/reviews/${encodeURIComponent(reviewId)}/reply`, {
    reply: reply.trim(),
  })
  return unwrap(response)
}
