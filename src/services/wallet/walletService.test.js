import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import {
  cancelMyWithdrawal,
  getMyWallet,
  getMyWalletTransactions,
  getMyWithdrawals,
  requestWithdrawal,
} from './walletService'

afterEach(() => vi.restoreAllMocks())

const ok = (data) => ({ status: 200, data: { success: true, code: 'SUCCESS', data } })

test('loads wallet balance, transactions, and withdrawals', async () => {
  const signal = new AbortController().signal
  const get = vi
    .spyOn(apiClient, 'get')
    .mockResolvedValueOnce(
      ok({ availableBalance: 100000, heldBalance: 0, pendingWithdrawBalance: 0 }),
    )
    .mockResolvedValueOnce(ok([{ id: 1, transactionType: 'REFUND', amount: 100000 }]))
    .mockResolvedValueOnce(ok([{ id: 2, amount: 50000, status: 'REQUESTED' }]))

  await expect(getMyWallet({ signal })).resolves.toMatchObject({ availableBalance: 100000 })
  await expect(getMyWalletTransactions({ signal })).resolves.toHaveLength(1)
  await expect(getMyWithdrawals({ signal })).resolves.toHaveLength(1)

  expect(get).toHaveBeenNthCalledWith(1, '/api/v1/wallets/me', { signal })
  expect(get).toHaveBeenNthCalledWith(2, '/api/v1/wallets/me/transactions', { signal })
  expect(get).toHaveBeenNthCalledWith(3, '/api/v1/withdrawals/me', { signal })
})

test('submits and cancels withdrawals with encoded id', async () => {
  const post = vi
    .spyOn(apiClient, 'post')
    .mockResolvedValueOnce({
      status: 201,
      data: { success: true, code: 'SUCCESS', data: { id: 12, status: 'REQUESTED' } },
    })
    .mockResolvedValueOnce(ok({ id: 12, status: 'CANCELLED' }))

  await expect(
    requestWithdrawal({
      amount: 50000,
      bankName: 'Vietcombank',
      bankAccountNumber: '0123456789',
      bankAccountHolder: 'NGUYEN VAN A',
      idempotencyKey: 'wd-123',
    }),
  ).resolves.toEqual({ id: 12, status: 'REQUESTED' })

  await expect(cancelMyWithdrawal({ withdrawalId: 12 })).resolves.toEqual({
    id: 12,
    status: 'CANCELLED',
  })

  expect(post).toHaveBeenNthCalledWith(1, '/api/v1/withdrawals', {
    amount: 50000,
    bankName: 'Vietcombank',
    bankAccountNumber: '0123456789',
    bankAccountHolder: 'NGUYEN VAN A',
    idempotencyKey: 'wd-123',
  })
  expect(post).toHaveBeenNthCalledWith(2, '/api/v1/withdrawals/12/cancel')
})
