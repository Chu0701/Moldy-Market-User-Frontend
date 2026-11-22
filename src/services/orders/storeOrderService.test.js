import { afterEach, expect, test, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import { getStoreOrders, confirmStoreOrder } from './storeOrderService'

afterEach(() => vi.restoreAllMocks())

test('preserves per-order payment metadata without deriving it from order status', async () => {
  const content = [
    {
      id: 'order',
      storeId: 'store',
      items: [],
      status: 'CONFIRMED',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      paidAt: null,
    },
  ]
  vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: {
      success: true,
      code: 'SUCCESS',
      data: { content, page: 1, size: 20, hasNext: false, totalElements: 1 },
    },
  })
  expect((await getStoreOrders({ storeId: 'store' })).items[0]).toEqual(content[0])
})

test('rejects a malformed payment object while allowing missing metadata on old data', async () => {
  const row = { id: 'order', storeId: 'store', items: [] }
  const body = (content) => ({
    data: {
      success: true,
      code: 'SUCCESS',
      data: { content, page: 1, size: 20, hasNext: false, totalElements: 1 },
    },
  })
  vi.spyOn(apiClient, 'get')
    .mockResolvedValueOnce(body([{ ...row, paymentStatus: { status: 'SUCCESSFUL' } }]))
    .mockResolvedValueOnce(body([row]))
  await expect(getStoreOrders({ storeId: 'store' })).rejects.toMatchObject({
    code: 'FE_UNKNOWN_ERROR',
  })
  await expect(getStoreOrders({ storeId: 'store' })).resolves.toMatchObject({ items: [row] })
})

test('reads a one-based store page, forwards abort and normalizes the existing PagedResponse', async () => {
  const content = [{ id: 'order', storeId: 'store/id', items: [] }]
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    data: {
      success: true,
      code: 'SUCCESS',
      data: { content, page: 2, size: 20, hasNext: false, totalElements: 21 },
    },
  })
  const signal = new AbortController().signal
  await expect(
    getStoreOrders({ storeId: 'store/id', page: 2, status: 'PENDING_CONFIRMED', signal }),
  ).resolves.toEqual({ items: content, page: 2, size: 20, hasNext: false, totalElements: 21 })
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/stores/store%2Fid/orders', {
    params: { page: 2, size: 20, status: 'PENDING_CONFIRMED' },
    signal,
  })
})

test('empty stores stay successful while a real permission error remains an error', async () => {
  vi.spyOn(apiClient, 'get')
    .mockResolvedValueOnce({
      data: {
        success: true,
        code: 'SUCCESS',
        data: { content: [], page: 1, size: 20, hasNext: false, totalElements: 0 },
      },
    })
    .mockRejectedValueOnce({ status: 403, code: 'STORE_ACCESS_DENIED' })
  await expect(getStoreOrders({ storeId: 'store' })).resolves.toMatchObject({
    items: [],
    totalElements: 0,
  })
  await expect(getStoreOrders({ storeId: 'store' })).rejects.toMatchObject({ status: 403 })
})

test.each([
  { content: null },
  { content: [{ id: 'foreign', storeId: 'another-store', items: [] }] },
  { content: [{ id: 'broken', storeId: 'store', items: null }] },
])(
  'rejects malformed or other-store rows instead of rendering customer data %#',
  async (override) => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        success: true,
        code: 'SUCCESS',
        data: { content: [], page: 1, size: 20, hasNext: false, totalElements: 1, ...override },
      },
    })
    await expect(getStoreOrders({ storeId: 'store' })).rejects.toMatchObject({
      code: 'FE_UNKNOWN_ERROR',
    })
  },
)

test('owner confirmation uses the existing seller route without a body and never retries errors', async () => {
  const post = vi
    .spyOn(apiClient, 'post')
    .mockResolvedValueOnce({
      data: { success: true, code: 'SUCCESS', data: { id: 'order/id', status: 'CONFIRMED' } },
    })
    .mockRejectedValueOnce({ status: 400, code: 'INVALID_ORDER_STATE' })
  await expect(confirmStoreOrder({ orderId: 'order/id' })).resolves.toMatchObject({
    status: 'CONFIRMED',
  })
  expect(post).toHaveBeenNthCalledWith(1, '/api/v1/orders/seller/order%2Fid/confirm')
  await expect(confirmStoreOrder({ orderId: 'order/id' })).rejects.toMatchObject({
    code: 'INVALID_ORDER_STATE',
  })
  expect(post).toHaveBeenCalledTimes(2)
})
