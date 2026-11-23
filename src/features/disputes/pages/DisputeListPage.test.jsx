import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { DisputeListPage } from '@/features/disputes/pages/DisputeListPage'
import { getMyDisputes } from '@/services/disputes/disputeService'

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    hasAccessToken: true,
    profileQuery: { isPending: false, isError: false, data: { id: 'buyer-1' } },
  }),
}))

vi.mock('@/services/disputes/disputeService', () => ({
  getMyDisputes: vi.fn(),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/disputes']}>
        <DisputeListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DisputeListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists buyer disputes with link to order detail', async () => {
    getMyDisputes.mockResolvedValue([
      {
        id: 'disp-1',
        orderId: 'order-123',
        reason: 'DAMAGED',
        status: 'OPEN',
        createdAt: '2026-11-23T01:00:00Z',
      },
    ])

    renderPage()

    expect(await screen.findByText(/order-123/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /xem đơn|view order/i })).toHaveAttribute(
      'href',
      '/orders/order-123',
    )
  })

  it('shows empty state when buyer has no disputes', async () => {
    getMyDisputes.mockResolvedValue([])
    renderPage()
    expect(await screen.findByRole('link', { name: /đơn mua|orders/i })).toHaveAttribute(
      'href',
      '/orders',
    )
  })

  it('shows error state on failure', async () => {
    getMyDisputes.mockRejectedValue({ status: 500 })
    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
