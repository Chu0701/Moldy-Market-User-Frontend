import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { ChatOfferCard } from '@/features/offers/components/ChatOfferCard'
import * as offerService from '@/services/offers/offerService'

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    hasAccessToken: true,
    profileQuery: { isPending: false, isError: false, data: { id: 'seller-1' } },
  }),
}))

vi.mock('@/features/cart/hooks/useCart', () => ({
  useAddCartItem: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}))

vi.mock('@/services/offers/offerService', () => ({
  getOfferDetail: vi.fn(),
  acceptOffer: vi.fn(),
  rejectOffer: vi.fn(),
  cancelOffer: vi.fn(),
  counterOffer: vi.fn(),
}))

function renderCard(props) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ChatOfferCard {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ChatOfferCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders structured offer card with product info, note, and allows seller to accept', async () => {
    offerService.getOfferDetail.mockResolvedValue({
      id: 'offer-10',
      negotiationId: 'neg-10',
      productId: 'prod-10',
      productTitle: 'MacBook Air M2',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      originalPrice: 20_000_000,
      price: 18_000_000,
      side: 'BUYER',
      status: 'PENDING',
      roundNumber: 1,
      note: 'Mình ở gần, lấy trong ngày được ạ',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    })
    offerService.acceptOffer.mockResolvedValue({ id: 'offer-10', status: 'ACCEPTED' })

    const user = userEvent.setup()
    renderCard({
      offerId: 'offer-10',
      userId: 'seller-1',
      peerName: 'Test User 1',
      isMine: false,
    })

    expect(await screen.findByText('MacBook Air M2')).toBeInTheDocument()
    expect(screen.getByText(/−10%/)).toBeInTheDocument()
    expect(screen.getByText(/Mình ở gần, lấy trong ngày được ạ/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Chấp nhận' }))
    await waitFor(() => {
      expect(offerService.acceptOffer).toHaveBeenCalledWith({ offerId: 'offer-10' })
    })
  })
})
