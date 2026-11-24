import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * Fetches the authenticated user's wallet balance.
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getMyWallet({ signal } = {}) {
  const response = await apiClient.get('/api/v1/wallets/me', { signal })
  return unwrap(response)
}

/**
 * Fetches the authenticated user's wallet ledger transactions.
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getMyWalletTransactions({ signal } = {}) {
  const response = await apiClient.get('/api/v1/wallets/me/transactions', { signal })
  return unwrap(response) ?? []
}

/**
 * Fetches the authenticated user's withdrawal requests.
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getMyWithdrawals({ signal } = {}) {
  const response = await apiClient.get('/api/v1/withdrawals/me', { signal })
  return unwrap(response) ?? []
}

/**
 * Submits a withdrawal request from the authenticated user's wallet.
 * @param {{
 *   amount: number,
 *   bankName: string,
 *   bankAccountNumber: string,
 *   bankAccountHolder: string,
 *   idempotencyKey: string
 * }} payload
 */
export async function requestWithdrawal({
  amount,
  bankName,
  bankAccountNumber,
  bankAccountHolder,
  idempotencyKey,
}) {
  const response = await apiClient.post('/api/v1/withdrawals', {
    amount,
    bankName,
    bankAccountNumber,
    bankAccountHolder,
    idempotencyKey,
  })
  return unwrap(response)
}

/**
 * Cancels a pending REQUESTED withdrawal belonging to the authenticated user.
 * @param {{ withdrawalId: number | string }} params
 */
export async function cancelMyWithdrawal({ withdrawalId }) {
  const response = await apiClient.post(
    '/api/v1/withdrawals/' + encodeURIComponent(String(withdrawalId)) + '/cancel',
  )
  return unwrap(response)
}
