import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import {
  changeProductStatus,
  createStoreProduct,
  deleteProduct,
  getMyProducts,
  getMyStoreProducts,
  getStoreProducts,
  searchProducts,
  updateProduct,
} from './productService'

afterEach(() => {
  vi.restoreAllMocks()
})

test('requests the private store-scoped product list with pagination and cancellation', async () => {
  const { signal } = new AbortController()
  const data = {
    content: [{ id: 'hidden', status: 'HIDDEN' }],
    page: 2,
    size: 20,
    totalElements: 21,
    hasNext: false,
  }
  const get = vi
    .spyOn(apiClient, 'get')
    .mockResolvedValue({ data: { success: true, code: 'SUCCESS', data } })
  await expect(getStoreProducts({ storeId: 'shop/id', page: 2, signal })).resolves.toMatchObject({
    items: data.content,
    page: 2,
  })
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/stores/shop%2Fid/products', {
    params: { page: 2, size: 20 },
    signal,
  })
})

test('posts a store listing with the seller-set pricing strategy', async () => {
  const fields = {
    storeId: 'store-1',
    categoryId: 'a8098c1a-f86e-11da-bd1a-00112444be1f',
    title: 'Sách cũ',
    price: 45000.5,
    condition: 'USED',
    imageFileIds: ['file-1'],
  }
  const product = { id: 'product-1', ...fields }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 201,
    data: { success: true, code: 'SUCCESS', data: product },
  })

  await expect(createStoreProduct(fields)).resolves.toEqual(product)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/products', {
    storeId: fields.storeId,
    categoryId: fields.categoryId,
    title: fields.title,
    description: '',
    price: fields.price,
    condition: fields.condition,
    pricingStrategy: 'SELLER_SET',
    imageFileIds: ['file-1'],
    allowOffer: true,
  })
})

test('preserves a provided description when posting a store listing', async () => {
  const fields = {
    storeId: 'store-1',
    categoryId: 'a8098c1a-f86e-11da-bd1a-00112444be1f',
    title: 'iPhone',
    description: 'iphone',
    price: 100000,
    condition: 'NEW',
    imageFileIds: [],
  }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 201,
    data: { success: true, code: 'SUCCESS', data: fields },
  })

  await createStoreProduct(fields)

  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/products', {
    storeId: fields.storeId,
    categoryId: fields.categoryId,
    title: fields.title,
    description: fields.description,
    price: fields.price,
    condition: fields.condition,
    pricingStrategy: 'SELLER_SET',
    imageFileIds: [],
    allowOffer: true,
  })
})

test('does not post a listing without a store ID', async () => {
  const post = vi.spyOn(apiClient, 'post')

  await expect(createStoreProduct({ storeId: null })).rejects.toThrow('requires a store ID')
  expect(post).not.toHaveBeenCalled()
})

test('updates a listing with version zero and an explicit empty managed-media replacement', async () => {
  const productId = 'a8098c1a-f86e-11da-bd1a-00112444be1f'
  const changes = {
    version: 0,
    title: 'Sách cũ',
    description: '',
    price: 45000.5,
    condition: 'USED',
    imageFileIds: [],
  }
  const product = { id: productId, ...changes }
  const put = vi.spyOn(apiClient, 'put').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: product },
  })

  await expect(updateProduct({ productId, ...changes })).resolves.toEqual(product)
  expect(put).toHaveBeenCalledExactlyOnceWith(`/api/v1/products/${productId}`, changes)
})

test.each(['HIDDEN', 'ACTIVE'])(
  'changes a listing to %s using a query parameter',
  async (status) => {
    const productId = 'a8098c1a-f86e-11da-bd1a-00112444be1f'
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      status: 200,
      data: { success: true, code: 'SUCCESS', data: null },
    })

    await expect(changeProductStatus({ productId, status })).resolves.toBeUndefined()
    expect(patch).toHaveBeenCalledExactlyOnceWith(
      `/api/v1/products/${productId}/status`,
      undefined,
      { params: { status } },
    )
  },
)

test('deletes a product and accepts a 204 response with no body', async () => {
  const productId = 'a8098c1a-f86e-11da-bd1a-00112444be1f'
  const remove = vi.spyOn(apiClient, 'delete').mockResolvedValue({ status: 204, data: '' })

  await expect(deleteProduct({ productId })).resolves.toBeUndefined()
  expect(remove).toHaveBeenCalledExactlyOnceWith(`/api/v1/products/${productId}`)
})

test.each([
  { content: [{ id: 'personal-product', status: 'HIDDEN' }], hasNext: true, totalElements: 3 },
  { content: [], hasNext: false, totalElements: 0 },
])(
  'reads the current seller’s listings with total $totalElements',
  async ({ content, hasNext, totalElements }) => {
    const { signal } = new AbortController()
    const data = { content, page: 1, size: 2, hasNext, totalElements }
    const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
      status: 200,
      data: { success: true, code: 'SUCCESS', data },
    })

    await expect(getMyProducts({ page: 1, size: 2, signal })).resolves.toEqual({
      items: content,
      page: 1,
      size: 2,
      hasNext,
      totalElements,
    })
    expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/products/me', {
      params: { page: 1, size: 2 },
      signal,
    })
  },
)

test('reads paged store listings without sending a store ID', async () => {
  const { signal } = new AbortController()
  const content = [{ id: 'store-product', status: 'HIDDEN' }]
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    status: 200,
    data: {
      success: true,
      code: 'SUCCESS',
      data: { content, page: 2, size: 5, hasNext: false, totalElements: 6 },
    },
  })

  await expect(getMyStoreProducts({ page: 2, size: 5, signal })).resolves.toEqual({
    items: content,
    page: 2,
    size: 5,
    hasNext: false,
    totalElements: 6,
  })
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/stores/my-store/products', {
    params: { page: 2, size: 5 },
    signal,
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

test('omits media fields when product update does not change media', async () => {
  const put = vi.spyOn(apiClient, 'put').mockResolvedValue({
    data: { success: true, code: 'SUCCESS', data: { id: 'product-1', version: 2 } },
  })

  await updateProduct({ productId: 'product-1', version: 1, title: 'Updated title' })

  expect(put).toHaveBeenCalledExactlyOnceWith('/api/v1/products/product-1', {
    version: 1,
    title: 'Updated title',
  })
})
