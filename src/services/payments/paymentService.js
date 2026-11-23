import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * @typedef {{
 *   id: string,
 *   amount: number,
 *   paymentStatus: string,
 *   method: 'COD'|'ONLINE_BANKING',
 *   qrBankUrl?: string | null,
 *   checkoutGroupId: string
 * }} PaymentRecord
 */

/**
 * Fetches all payments created by the authenticated user.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<PaymentRecord[]>}
 */
export async function getMyPayments({ signal } = {}) {
  const response = await apiClient.get('/api/v1/payments/my-payments', { signal })
  return unwrap(response) ?? []
}

/**
 * Fetches a single payment belonging to the authenticated user.
 * @param {{ paymentId: string, signal?: AbortSignal }} params
 * @returns {Promise<PaymentRecord>}
 */
export async function getPaymentById({ paymentId, signal }) {
  const response = await apiClient.get(`/api/v1/payments/${encodeURIComponent(paymentId)}`, {
    signal,
  })
  return unwrap(response)
}
