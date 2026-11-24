import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import i18n from '@/i18n'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { getMe } from '@/services/users/userService'
import {
  cancelMyWithdrawal,
  getMyWallet,
  getMyWalletTransactions,
  getMyWithdrawals,
  requestWithdrawal,
} from '@/services/wallet/walletService'
import { WalletPage } from './WalletPage'

vi.mock('@/services/users/userService', () => ({ getMe: vi.fn() }))
vi.mock('@/services/wallet/walletService', () => ({
  getMyWallet: vi.fn(),
  getMyWalletTransactions: vi.fn(),
  getMyWithdrawals: vi.fn(),
  requestWithdrawal: vi.fn(),
  cancelMyWithdrawal: vi.fn(),
}))

const profile = {
  id: 'wallet-user',
  fullName: 'Nguyen Van A',
  bankName: 'Vietcombank',
  bankAccountNumber: '0123456789',
}

let queryClient

beforeEach(async () => {
  setAccessToken('wallet-token')
  vi.mocked(getMe).mockReset().mockResolvedValue(profile)
  vi.mocked(getMyWallet).mockReset().mockResolvedValue({
    userId: profile.id,
    availableBalance: 250000,
    pendingWithdrawBalance: 50000,
    heldBalance: 0,
    status: 'ACTIVE',
  })
  vi.mocked(getMyWithdrawals)
    .mockReset()
    .mockResolvedValue([
      {
        id: 7,
        amount: 50000,
        bankName: 'Vietcombank',
        maskedBankAccountNumber: '****6789',
        bankAccountHolder: 'Nguyen Van A',
        status: 'REQUESTED',
        requestedAt: '2026-11-23T08:00:00Z',
      },
    ])
  vi.mocked(getMyWalletTransactions)
    .mockReset()
    .mockResolvedValue([
      {
        id: 1,
        transactionType: 'REFUND',
        amount: 300000,
        availableBalanceAfter: 300000,
        description: 'Dispute refund for order ORD-1',
        createdAt: '2026-11-23T07:00:00Z',
      },
    ])
  vi.mocked(requestWithdrawal).mockReset().mockResolvedValue({ id: 8, status: 'REQUESTED' })
  vi.mocked(cancelMyWithdrawal).mockReset().mockResolvedValue({ id: 7, status: 'CANCELLED' })
  await i18n.changeLanguage('vi')
})

afterEach(() => {
  clearAccessToken()
  queryClient?.clear()
})

function renderWallet() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <WalletPage />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

test('renders balances, withdrawal history, and refund transactions', async () => {
  renderWallet()
  expect(await screen.findByRole('heading', { name: 'Ví của tôi' })).toBeInTheDocument()
  expect(screen.getByText(/250\.000/)).toBeInTheDocument()
  expect(await screen.findByText(/Vietcombank • \*\*\*\*6789/)).toBeInTheDocument()
  expect(await screen.findByText('Hoàn tiền tranh chấp')).toBeInTheDocument()
})

test('submits a withdrawal request and cancels a pending withdrawal', async () => {
  const user = renderWallet()
  await screen.findByRole('heading', { name: 'Ví của tôi' })

  await waitFor(() => expect(screen.getByLabelText('Tên ngân hàng')).toHaveValue('Vietcombank'))
  await user.type(screen.getByLabelText('Số tiền rút (VND)'), '100000')
  await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu rút tiền' }))

  await screen.findByText('Đã gửi yêu cầu rút tiền.')
  expect(requestWithdrawal).toHaveBeenCalledTimes(1)
  expect(requestWithdrawal).toHaveBeenCalledWith(
    expect.objectContaining({
      amount: 100000,
      bankName: 'Vietcombank',
      bankAccountNumber: '0123456789',
      bankAccountHolder: 'Nguyen Van A',
    }),
  )

  await user.click(screen.getByRole('button', { name: 'Hủy yêu cầu' }))
  await screen.findByText('Đã hủy yêu cầu rút tiền và hoàn lại số dư khả dụng.')
  expect(cancelMyWithdrawal).toHaveBeenCalledWith({ withdrawalId: 7 })
})
