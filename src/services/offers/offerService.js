import { apiClient } from '@/services/api/client'
import { normalizeOfferPage } from '@/services/api/pagination'
import { unwrap } from '@/services/api/unwrap'
/**
 * @typedef {'BUYER' | 'SELLER'} OfferSide
 * @typedef {'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'SUPERSEDED'} OfferStatus
 *
 * @typedef {{
 *   id: string,
 *   negotiationId: string,
 *   previousOfferId?: string | null,
 *   productId: string,
 *   buyerId: string,
 *   sellerId: string,
 *   storeId?: string | null,
 *   originalPrice: number,
 *   price: number,
 *   side: OfferSide,
 *   status: OfferStatus,
 *   expiresAt: string,
 *   acceptedExpiresAt?: string | null,
 *   createdAt: string,
 *   updatedAt: string
 * }} OfferResponse
 */

/**
 * @param {{ productId: string, price: number }} payload
 * @returns {Promise<OfferResponse | undefined>}
 */
export async function createOffer({ productId, price }) {
  const response = await apiClient.post('/api/v1/offers', {
    productId,
    price,
  })
  return unwrap(response)
}

/**
 * @param {{ offerId: string, price: number }} payload
 * @returns {Promise<OfferResponse | undefined>}
 */
export async function counterOffer({ offerId, price }) {
  const response = await apiClient.post(`/api/v1/offers/${encodeURIComponent(offerId)}/counter`, {
    price,
  })
  return unwrap(response)
}

/**
 * @param {{ offerId: string }} payload
 * @returns {Promise<OfferResponse | undefined>}
 */
export async function acceptOffer({ offerId }) {
  const response = await apiClient.patch(`/api/v1/offers/${encodeURIComponent(offerId)}/accept`)
  return unwrap(response)
}

/**
 * @param {{ offerId: string }} payload
 * @returns {Promise<OfferResponse | undefined>}
 */
export async function rejectOffer({ offerId }) {
  const response = await apiClient.patch(`/api/v1/offers/${encodeURIComponent(offerId)}/reject`)
  return unwrap(response)
}
/**
 * @param {{ offerId: string }} payload
 * @returns {Promise<OfferResponse | undefined>}
 */
export async function cancelOffer({ offerId }) {
  const response = await apiClient.patch(`/api/v1/offers/${encodeURIComponent(offerId)}/cancel`)
  return unwrap(response)
}
/**
 * @param {{ page?: number, size?: number, signal?: AbortSignal }} [params]
 */
export async function getSentOffers({ page = 1, size = 10, signal } = {}) {
  const response = await apiClient.get('/api/v1/offers/sent', {
    params: { page, size },
    signal,
  })
  return normalizeOfferPage(unwrap(response))
}
/**
 * @param {{ page?: number, size?: number, signal?: AbortSignal }} [params]
 */
export async function getReceivedOffers({ page = 1, size = 10, signal } = {}) {
  const response = await apiClient.get('/api/v1/offers/received', {
    params: { page, size },
    signal,
  })
  return normalizeOfferPage(unwrap(response))
}
/**
 * @param {{ offerId: string, signal?: AbortSignal }} params
 * @returns {Promise<OfferResponse | undefined>}
 */
export async function getOfferDetail({ offerId, signal }) {
  const response = await apiClient.get(`/api/v1/offers/${encodeURIComponent(offerId)}`, { signal })
  return unwrap(response)
}
/**
 * @param {{ offerId: string, page?: number, size?: number, signal?: AbortSignal }} params
 */
export async function getOfferHistory({ offerId, page = 1, size = 20, signal }) {
  const response = await apiClient.get(`/api/v1/offers/${encodeURIComponent(offerId)}/history`, {
    params: { page, size },
    signal,
  })
  return normalizeOfferPage(unwrap(response))
}
