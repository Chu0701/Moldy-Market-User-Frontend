import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { searchProducts } from './productService'

afterEach(() => {
  vi.restoreAllMocks()
})

test('sends the store filter with search and pagination parameters', async () => {
  const storeId = 'a8098c1a-f86e-11da-bd1a-00112444be1f'
  const items = [{ id: 'product-1', storeId }]
  const { signal } = new AbortController()
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    status: 200,
    data: {
      success: true,
      code: 'SUCCESS',
      data: { items, page: 2, size: 8, totalPages: 3 },
    },
  })

  const result = await searchProducts({ storeId, q: 'áo', page: 2, sort: 'price_asc', signal })

  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/products/search', {
    params: { q: 'áo', storeId, page: 2, size: 8, sort: 'price_asc' },
    signal,
  })
  expect(result).toMatchObject({ items, page: 2, hasNext: true })
})
