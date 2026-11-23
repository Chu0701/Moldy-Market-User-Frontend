import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import {
  addToWishlist,
  checkWishlisted,
  getProductWishlistCount,
  getWishlist,
  getWishlistCount,
  removeFromWishlist,
} from '@/services/wishlist/wishlistService'

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('wishlistService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('converts 1-based UI page to 0-based Spring Page query param', async () => {
    const signal = new AbortController().signal
    apiClient.get.mockResolvedValue({
      data: {
        success: true,
        code: 'SUCCESS',
        data: {
          content: [{ id: 'w-1', productId: 'p-1', createdAt: '2026-11-23T00:00:00Z' }],
          number: 1,
          size: 20,
          totalElements: 21,
          totalPages: 2,
          last: true,
        },
      },
    })

    const result = await getWishlist({ page: 2, size: 20, signal })

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/wishlists', {
      params: { page: 1, size: 20 },
      signal,
    })
    expect(result.page).toBe(2)
    expect(result.hasNext).toBe(false)
    expect(result.items).toHaveLength(1)
  })

  it('adds, removes, checks and counts wishlist entries', async () => {
    apiClient.post.mockResolvedValue({
      data: {
        success: true,
        code: 'SUCCESS',
        data: { id: 'w-1', productId: 'p/1', createdAt: '2026-11-23Z' },
      },
    })
    apiClient.delete.mockResolvedValue({ data: { success: true, code: 'SUCCESS', data: null } })
    apiClient.get
      .mockResolvedValueOnce({ data: { success: true, code: 'SUCCESS', data: true } })
      .mockResolvedValueOnce({ data: { success: true, code: 'SUCCESS', data: 3 } })
      .mockResolvedValueOnce({ data: { success: true, code: 'SUCCESS', data: 12 } })

    const added = await addToWishlist({ productId: 'p/1' })
    await removeFromWishlist({ productId: 'p/1' })
    const saved = await checkWishlisted({ productId: 'p/1' })
    const count = await getWishlistCount()
    const productCount = await getProductWishlistCount({ productId: 'p/1' })

    expect(apiClient.post).toHaveBeenCalledWith('/api/v1/wishlists/p%2F1')
    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/wishlists/p%2F1')
    expect(added.id).toBe('w-1')
    expect(saved).toBe(true)
    expect(count).toBe(3)
    expect(productCount).toBe(12)
  })
})
