import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * @typedef {'PERCENT'|'FIXED'} DiscountType
 * @typedef {{
 *   code: string,
 *   discountType: DiscountType,
 *   discountValue: number,
 *   remainingQuantity: number,
 *   expiredAt: string,
 *   issuer: 'PLATFORM'|'STORE',
 *   storeId?: string | null,
 *   minimumOrderValue?: number | null,
 *   maximumDiscount?: number | null,
 *   active: boolean
 * }} Voucher
 */

/**
 * Checks validity of a voucher code (authenticated per SecurityConfig).
 * @param {{ code: string, signal?: AbortSignal }} params
 */
export async function checkVoucher({ code, signal }) {
  const response = await apiClient.get(`/api/vouchers/${encodeURIComponent(code)}`, { signal })
  return unwrap(response)
}

/**
 * Lists vouchers belonging to the authenticated shop owner's store.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Voucher[]>}
 */
export async function getMyStoreVouchers({ signal } = {}) {
  const response = await apiClient.get('/api/shop/vouchers', { signal })
  return unwrap(response) ?? []
}

/**
 * Fetches one store voucher by code.
 * @param {{ code: string, signal?: AbortSignal }} params
 * @returns {Promise<Voucher>}
 */
export async function getMyStoreVoucher({ code, signal }) {
  const response = await apiClient.get(`/api/shop/vouchers/${encodeURIComponent(code)}`, {
    signal,
  })
  return unwrap(response)
}

/**
 * Creates a store voucher for the authenticated shop owner.
 * @param {{
 *   code: string,
 *   discountType: DiscountType,
 *   discountValue: number,
 *   remainingQuantity: number,
 *   expiredAt: string,
 *   minimumOrderValue?: number | null,
 *   maximumDiscount?: number | null
 * }} payload
 * @returns {Promise<Voucher>}
 */
export async function createStoreVoucher(payload) {
  const response = await apiClient.post('/api/shop/vouchers', payload)
  return unwrap(response)
}

/**
 * Updates discount/quantity/expiry settings for an existing store voucher.
 * @param {{
 *   code: string,
 *   discountType: DiscountType,
 *   discountValue: number,
 *   remainingQuantity: number,
 *   expiredAt: string,
 *   minimumOrderValue?: number | null,
 *   maximumDiscount?: number | null
 * }} payload
 * @returns {Promise<Voucher>}
 */
export async function updateStoreVoucher({ code, ...body }) {
  const response = await apiClient.put(`/api/shop/vouchers/${encodeURIComponent(code)}`, body)
  return unwrap(response)
}

/**
 * Soft-deactivates an existing store voucher (204 No Content).
 * @param {{ code: string }} params
 */
export async function deactivateStoreVoucher({ code }) {
  const response = await apiClient.delete(`/api/shop/vouchers/${encodeURIComponent(code)}`)
  return unwrap(response)
}
