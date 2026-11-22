import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { ApiError } from '@/services/api/ApiError'
import { getMyOrders } from './orderService'

afterEach(() => vi.restoreAllMocks())

test('loads only the authenticated buyer list, forwards cancellation and unwraps it', async () => {
  const orders = [{ id: 'order-id', orderCode: 'ORD-00001' }]
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: orders },
  })
  const signal = new AbortController().signal
  await expect(getMyOrders({ signal })).resolves.toEqual(orders)
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/orders/me', { signal })
})

test('treats the documented empty-order error as an empty list', async () => {
  vi.spyOn(apiClient, 'get').mockRejectedValue(
    new ApiError({
      status: 404,
      code: 'ORDER_LIST_NOT_FOUND',
      message: 'No orders',
    }),
  )
  await expect(getMyOrders()).resolves.toEqual([])
})

test.each([
  [404, 'RESOURCE_NOT_FOUND'],
  [403, 'FORBIDDEN'],
  [500, 'INTERNAL_SERVER_ERROR'],
  [null, 'FE_NETWORK_ERROR'],
])('preserves a %s %s failure instead of hiding it as empty', async (status, code) => {
  const error = new ApiError({ status, code, message: 'Request failed' })
  vi.spyOn(apiClient, 'get').mockRejectedValue(error)
  await expect(getMyOrders()).rejects.toBe(error)
})
