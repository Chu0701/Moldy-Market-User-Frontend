import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { TransactionsPage } from '@/features/payments/pages/TransactionsPage'
import { getMyPayments } from '@/services/payments/paymentService'

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    hasAccessToken: true,
    profileQuery: { isPending: false, isError: false, data: { id: 'user-1' } },
  }),
}))

vi.mock('@/services/payments/paymentService', () => ({
  getMyPayments: vi.fn(),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/transactions']}>
        <TransactionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists caller payments with link to checkout group', async () => {
    getMyPayments.mockResolvedValue([
      {
        id: 'pay-99',
        amount: 450000,
        paymentStatus: 'SUCCESSFUL',
        method: 'ONLINE_BANKING',
        checkoutGroupId: 'cg-99',
      },
    ])

    renderPage()

    expect(await screen.findByText(/pay-99/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /chi tiết thanh toán|view checkout/i }),
    ).toHaveAttribute('href', '/checkout/cg-99')
  })

  it('renders empty state when user has no payments', async () => {
    getMyPayments.mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('link', { name: /đơn mua|orders/i })).toHaveAttribute(
      'href',
      '/orders',
    )
  })
})
