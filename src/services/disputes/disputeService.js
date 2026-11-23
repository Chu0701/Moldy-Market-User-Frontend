import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * @typedef {'ITEM_NOT_RECEIVED'|'NOT_AS_DESCRIBED'|'DAMAGED'|'WRONG_ITEM'|'OTHER'} DisputeReason
 * @typedef {'OPEN'|'PENDING_APPROVAL'|'APPROVED'|'REJECTED'|'CANCELLED'} DisputeStatus
 * @typedef {{ id: string, orderId: string, reason: DisputeReason, status: DisputeStatus, createdAt: string }} DisputeSummary
 * @typedef {{
 *   id: string,
 *   orderId: string,
 *   buyerId: string,
 *   sellerId: string,
 *   reason: DisputeReason,
 *   description: string,
 *   imageUrls: string[],
 *   status: DisputeStatus,
 *   reviewedBy?: string | null,
 *   reviewedAt?: string | null,
 *   decisionNote?: string | null,
 *   createdAt: string
 * }} DisputeDetail
 */

/**
 * Fetches all disputes created by the authenticated buyer.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<DisputeSummary[]>}
 */
export async function getMyDisputes({ signal } = {}) {
  const response = await apiClient.get('/api/v1/disputes/me', { signal })
  return unwrap(response) ?? []
}

/**
 * Fetches the authenticated buyer's dispute for a specific order.
 * @param {{ orderId: string, signal?: AbortSignal }} params
 * @returns {Promise<DisputeDetail>}
 */
export async function getMyDisputeByOrder({ orderId, signal }) {
  const response = await apiClient.get(`/api/v1/disputes/${encodeURIComponent(orderId)}`, {
    signal,
  })
  return unwrap(response)
}

/**
 * Opens (or reopens if cancelled) a dispute for a completed order.
 * @param {{ orderId: string, reason: DisputeReason, description: string, imageUrls?: string[] }} payload
 * @returns {Promise<DisputeDetail>}
 */
export async function createDispute({ orderId, reason, description, imageUrls = [] }) {
  const response = await apiClient.post('/api/v1/disputes', {
    orderId,
    reason,
    description,
    imageUrls,
  })
  return unwrap(response)
}

/**
 * Cancels an open/pending buyer dispute for an order.
 * @param {{ orderId: string }} params
 * @returns {Promise<DisputeDetail>}
 */
export async function cancelDispute({ orderId }) {
  const response = await apiClient.post(`/api/v1/disputes/${encodeURIComponent(orderId)}/cancel`)
  return unwrap(response)
}
