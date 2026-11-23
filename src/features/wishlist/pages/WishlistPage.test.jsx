import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

import { WishlistPage } from '@/features/wishlist/pages/WishlistPage'
import { getWishlist, removeFromWishlist } from '@/services/wishlist/wishlistService'
import { getProductById } from '@/services/products/productService'

vi.mock('@/features/auth/hooks/useSession', () => ({
  useSession: () => ({
    hasAccessToken: true,
    profileQuery: { isPending: false, isError: false, data: { id: 'user-1' } },
  }),
}))

vi.mock('@/services/wishlist/wishlistService', () => ({
  getWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
}))

vi.mock('@/services/products/productService', () => ({
  getProductById: vi.fn(),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/wishlist']}>
        <WishlistPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('WishlistPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders wishlisted products and allows removing an item', async () => {
    getWishlist.mockResolvedValue({
      items: [{ id: 'w-1', productId: 'prod-1', createdAt: '2026-11-23T00:00:00Z' }],
      page: 1,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    })
    getProductById.mockResolvedValue({
      id: 'prod-1',
      title: 'Vintage Film Camera',
      price: 1500000,
      status: 'ACTIVE',
      images: [],
    })
    removeFromWishlist.mockResolvedValue(null)

    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('Vintage Film Camera')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /bỏ yêu thích|remove/i }))
    expect(removeFromWishlist).toHaveBeenCalledWith({ productId: 'prod-1' })
  })

  it('renders empty state when wishlist has no items', async () => {
    getWishlist.mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
    })

    renderPage()

    expect(await screen.findByRole('link', { name: /khám phá|browse/i })).toHaveAttribute(
      'href',
      '/products',
    )
  })

  it('renders error state when wishlist fails to load', async () => {
    getWishlist.mockRejectedValue({ status: 500 })

    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
