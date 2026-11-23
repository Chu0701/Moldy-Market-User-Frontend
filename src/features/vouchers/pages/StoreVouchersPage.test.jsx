import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { StoreVouchersPage } from '@/features/vouchers/pages/StoreVouchersPage'
import { deactivateStoreVoucher, getMyStoreVouchers } from '@/services/vouchers/voucherService'

const sessionMock = vi.fn()

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => sessionMock(),
}))

vi.mock('@/services/vouchers/voucherService', () => ({
  getMyStoreVouchers: vi.fn(),
  createStoreVoucher: vi.fn(),
  updateStoreVoucher: vi.fn(),
  deactivateStoreVoucher: vi.fn(),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/store/vouchers']}>
        <StoreVouchersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('StoreVouchersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionMock.mockReturnValue({
      hasAccessToken: true,
      profileQuery: {
        isPending: false,
        isError: false,
        data: { id: 'owner-1', roles: ['USER', 'OWNER'] },
      },
    })
  })

  it('lists store vouchers and supports deactivating an active voucher', async () => {
    getMyStoreVouchers.mockResolvedValue([
      {
        code: 'SHOP20',
        discountType: 'PERCENT',
        discountValue: 20,
        remainingQuantity: 15,
        expiredAt: '2026-12-31T00:00:00Z',
        active: true,
      },
    ])
    deactivateStoreVoucher.mockResolvedValue(undefined)

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('SHOP20')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /tắt mã|deactivate/i }))
    expect(deactivateStoreVoucher).toHaveBeenCalledWith({ code: 'SHOP20' })
  })

  it('shows forbidden state for non-owners', async () => {
    sessionMock.mockReturnValue({
      hasAccessToken: true,
      profileQuery: {
        isPending: false,
        isError: false,
        data: { id: 'user-2', roles: ['USER'] },
      },
    })

    renderPage()

    expect(await screen.findByRole('heading')).toBeInTheDocument()
    expect(getMyStoreVouchers).not.toHaveBeenCalled()
  })
})
