import { afterEach, expect, test, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import { cancelMyOrder } from './cancelOrderService'

afterEach(() => vi.restoreAllMocks())

test('cancels one buyer order via the existing endpoint without a body or invented group endpoint', async () => {
  const order = { id: 'order/id', status: 'CANCELLED' }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    data: { success: true, code: 'SUCCESS', data: order },
  })
  await expect(cancelMyOrder({ orderId: 'order/id' })).resolves.toEqual(order)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/orders/buyer/order%2Fid/cancel')
})

test('preserves a failed cancellation and never retries the POST automatically', async () => {
  const error = { status: 400, code: 'INVALID_ORDER_STATE' }
  const post = vi.spyOn(apiClient, 'post').mockRejectedValue(error)
  await expect(cancelMyOrder({ orderId: 'order-1' })).rejects.toBe(error)
  expect(post).toHaveBeenCalledTimes(1)
})
