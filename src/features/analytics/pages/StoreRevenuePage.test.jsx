import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { StoreRevenuePage } from '@/features/analytics/pages/StoreRevenuePage'
import {
  getSellerOverview,
  getSellerRevenueChart,
  getSellerTopProducts,
} from '@/services/analytics/analyticsService'

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    hasAccessToken: true,
    profileQuery: { isPending: false, isError: false, data: { id: 'seller-1' } },
  }),
}))

vi.mock('@/services/analytics/analyticsService', () => ({
  getSellerOverview: vi.fn(),
  getSellerRevenueChart: vi.fn(),
  getSellerTopProducts: vi.fn(),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/store/revenue']}>
        <StoreRevenuePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('StoreRevenuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders overview metrics, revenue bars, and top selling products', async () => {
    getSellerOverview.mockResolvedValue({
      totalRevenue: 1200000,
      totalOrders: 3,
      activeProducts: 4,
      soldProducts: 3,
    })
    getSellerRevenueChart.mockResolvedValue([
      { date: '2026-11-22', revenue: 1200000, orderCount: 3 },
    ])
    getSellerTopProducts.mockResolvedValue([
      { productId: 'p-1', productName: 'Retro Walkman', totalSold: 2, totalRevenue: 800000 },
    ])

    renderPage()

    expect(await screen.findByText('Retro Walkman')).toBeInTheDocument()
    expect(screen.getByText('2026-11-22')).toBeInTheDocument()
  })

  it('shows error state when overview fails', async () => {
    getSellerOverview.mockRejectedValue({ status: 500 })
    getSellerRevenueChart.mockResolvedValue([])
    getSellerTopProducts.mockResolvedValue([])

    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
