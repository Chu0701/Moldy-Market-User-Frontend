import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { ReceivedOffersPage } from '@/features/offers/pages/ReceivedOffersPage'
import * as offerService from '@/services/offers/offerService'

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    hasAccessToken: true,
    profileQuery: { isPending: false, isError: false, data: { id: 'seller-1' } },
  }),
}))

vi.mock('@/services/offers/offerService', () => ({
  getReceivedOffers: vi.fn(),
  acceptOffer: vi.fn(),
  rejectOffer: vi.fn(),
  counterOffer: vi.fn(),
  getOfferHistory: vi.fn(),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/store/offers']}>
        <ReceivedOffersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ReceivedOffersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows seller to accept or counter a pending buyer offer', async () => {
    offerService.getReceivedOffers.mockResolvedValue({
      items: [
        {
          id: 'offer-2',
          negotiationId: 'neg-2',
          productId: 'prod-87654321',
          originalPrice: 2_000_000,
          price: 1_600_000,
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
    offerService.acceptOffer.mockResolvedValue({ id: 'offer-2', status: 'ACCEPTED' })

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText(/1\.600\.000/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Chấp nhận' }))

    await waitFor(() => {
      expect(offerService.acceptOffer).toHaveBeenCalledWith({ offerId: 'offer-2' })
    })
  })
})
