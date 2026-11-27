import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { SentOffersPage } from '@/features/offers/pages/SentOffersPage'
import { ApiError } from '@/services/api/ApiError'
import * as offerService from '@/services/offers/offerService'

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    hasAccessToken: true,
    profileQuery: { isPending: false, isError: false, data: { id: 'buyer-1' } },
  }),
}))

vi.mock('@/features/cart/hooks/useCart', () => ({
  useAddCartItem: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}))

vi.mock('@/services/offers/offerService', () => ({
  getSentOffers: vi.fn(),
  acceptOffer: vi.fn(),
  rejectOffer: vi.fn(),
  cancelOffer: vi.fn(),
  counterOffer: vi.fn(),
  getOfferHistory: vi.fn(),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/offers']}>
        <SentOffersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SentOffersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists buyer offers and allows cancelling a pending offer', async () => {
    offerService.getSentOffers.mockResolvedValue({
      items: [
        {
          id: 'offer-1',
          negotiationId: 'neg-1',
          productId: 'prod-12345678',
          originalPrice: 1_000_000,
          price: 850_000,
          side: 'BUYER',
          status: 'PENDING',
          createdAt: '2026-11-26T10:00:00Z',
          expiresAt: '2026-11-27T10:00:00Z',
        },
      ],
      page: 1,
      size: 10,
      totalPages: 1,
      totalElements: 1,
      hasNext: false,
    })
    offerService.cancelOffer.mockResolvedValue({ id: 'offer-1', status: 'CANCELLED' })

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText(/850\.000/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hủy đề nghị' }))

    await waitFor(() => {
      expect(offerService.cancelOffer).toHaveBeenCalledWith({ offerId: 'offer-1' })
    })
  })

  it('renders ForbiddenState on 403', async () => {
    offerService.getSentOffers.mockRejectedValue(
      new ApiError({ status: 403, code: 'COMMON_004', message: 'Forbidden' }),
    )

    renderPage()
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
