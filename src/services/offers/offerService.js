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
 *   updatedAt: string,
 *   note?: string | null,
 *   roundNumber?: number,
 *   checkoutGroupId?: string | null,
 *   closeReason?: string | null,
 *   productTitle?: string | null,
 *   productImage?: string | null,
 *   buyerName?: string | null,
 * }} OfferResponse
 */

/**
 * @param {{ productId: string, price: number, note?: string }} payload
 * @returns {Promise<OfferResponse | undefined>}
 */
export async function createOffer({ productId, price, note }) {
  const trimmedNote = typeof note === 'string' && note.trim() ? note.trim() : undefined
  const response = await apiClient.post('/api/v1/offers', {
    productId,
    price,
    ...(trimmedNote ? { note: trimmedNote } : {}),
  })
  return unwrap(response)
}

/**
 * @param {{ offerId: string, price: number, note?: string }} payload
 * @returns {Promise<OfferResponse | undefined>}
 */
export async function counterOffer({ offerId, price, note }) {
  const trimmedNote = typeof note === 'string' && note.trim() ? note.trim() : undefined
  const response = await apiClient.post(`/api/v1/offers/${encodeURIComponent(offerId)}/counter`, {
    price,
    ...(trimmedNote ? { note: trimmedNote } : {}),
  })
  return unwrap(response)
}

/** @param {{ offerId: string }} payload */
export async function acceptOffer({ offerId }) {
  const response = await apiClient.patch(`/api/v1/offers/${encodeURIComponent(offerId)}/accept`)
  return unwrap(response)
}

/** @param {{ offerId: string }} payload */
export async function rejectOffer({ offerId }) {
  const response = await apiClient.patch(`/api/v1/offers/${encodeURIComponent(offerId)}/reject`)
  return unwrap(response)
}

/** @param {{ offerId: string }} payload */
export async function cancelOffer({ offerId }) {
  const response = await apiClient.patch(`/api/v1/offers/${encodeURIComponent(offerId)}/cancel`)
  return unwrap(response)
}

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [params] */
export async function getSentOffers({ page = 1, size = 10, signal } = {}) {
  const response = await apiClient.get('/api/v1/offers/sent', {
    params: { page, size },
    signal,
  })
  return normalizeOfferPage(unwrap(response))
}

/** @param {{ page?: number, size?: number, signal?: AbortSignal }} [params] */
export async function getReceivedOffers({ page = 1, size = 10, signal } = {}) {
  const response = await apiClient.get('/api/v1/offers/received', {
    params: { page, size },
    signal,
  })
  return normalizeOfferPage(unwrap(response))
}

/** @param {{ productId: string, signal?: AbortSignal }} params */
export async function getActiveOfferForProduct({ productId, signal }) {
  const response = await apiClient.get(
    `/api/v1/offers/product/${encodeURIComponent(productId)}/active`,
    { signal },
  )
  return unwrap(response) ?? null
}

/** @param {{ offerId: string, signal?: AbortSignal }} params */
export async function getOfferDetail({ offerId, signal }) {
  const response = await apiClient.get(`/api/v1/offers/${encodeURIComponent(offerId)}`, { signal })
  return unwrap(response)
}

/** @param {{ offerId: string, page?: number, size?: number, signal?: AbortSignal }} params */
export async function getOfferHistory({ offerId, page = 1, size = 20, signal }) {
  const response = await apiClient.get(`/api/v1/offers/${encodeURIComponent(offerId)}/history`, {
    params: { page, size },
    signal,
  })
  return normalizeOfferPage(unwrap(response))
}
