import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { createPersonal, searchProducts } from './productService'

afterEach(() => {
  vi.restoreAllMocks()
})

test('posts a personal listing with the seller-set pricing strategy', async () => {
  const fields = {
    categoryId: 'a8098c1a-f86e-11da-bd1a-00112444be1f',
    title: 'Sách cũ',
    price: 45000.5,
    condition: 'USED',
    images: ['https://example.com/book.jpg'],
  }
  const product = { id: 'product-1', ...fields }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 201,
    data: { success: true, code: 'SUCCESS', data: product },
  })

  await expect(createPersonal(fields)).resolves.toEqual(product)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/products', {
    ...fields,
    description: undefined,
    storeId: null,
    pricingStrategy: 'SELLER_SET',
  })
})

test.each(['storeId', 'categoryId'])(
  'sends the %s filter with search and pagination parameters',
  async (filter) => {
    const id = 'a8098c1a-f86e-11da-bd1a-00112444be1f'
    const items = [{ id: 'product-1', [filter]: id }]
    const { signal } = new AbortController()
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      status: 200,
      data: {
        success: true,
        code: 'SUCCESS',
        data: { items, page: 2, size: 8, totalPages: 3 },
      },
    })

    const result = await searchProducts({
      [filter]: id,
      q: 'áo',
      page: 2,
      sort: 'price_asc',
      signal,
    })

    expect(get).toHaveBeenCalledExactlyOnceWith(
      '/api/v1/products/search',
      expect.objectContaining({
        params: expect.objectContaining({
          q: 'áo',
          [filter]: id,
          page: 2,
          size: 8,
          sort: 'price_asc',
        }),
        signal,
      }),
    )
    expect(result).toMatchObject({ items, page: 2, hasNext: true })
  },
)

test('serializes selected filters as repeated query parameters understood by Backend', async () => {
  const categoryId = [
    'a8098c1a-f86e-11da-bd1a-00112444be1e',
    'a8098c1a-f86e-11da-bd1a-00112444be1f',
  ]
  const condition = ['NEW', 'USED']
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: { success: true, code: 'SUCCESS', data: { items: [], page: 1, totalPages: 0 } },
  })

  await searchProducts({ categoryId, condition, minPrice: 0, maxPrice: 200000 })

  const [url, config] = get.mock.calls[0]
  const request = new URL(apiClient.getUri({ url, ...config }), 'http://localhost')
  expect(request.searchParams.getAll('categoryId')).toEqual(categoryId)
  expect(request.searchParams.getAll('condition')).toEqual(condition)
  expect(request.searchParams.get('minPrice')).toBe('0')
  expect(request.searchParams.get('maxPrice')).toBe('200000')
})
