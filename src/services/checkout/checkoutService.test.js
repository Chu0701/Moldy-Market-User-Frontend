import { afterEach, expect, test, vi } from 'vitest'
import { apiClient } from '@/services/api/client'
import { createCheckout, getCheckout } from './checkoutService'

afterEach(() => vi.restoreAllMocks())
const checkout = { id: 'checkout-id', totalAmount: 120000 }
const response = { status: 201, data: { success: true, code: 'SUCCESS', data: checkout } }

test('creates from selected ids and delivery fields without client prices or account ids', async () => {
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue(response)
  const input = {
    productIds: ['one', 'two'],
    receiverName: 'Chu',
    phoneNumber: '0901234567',
    shippingAddress: 'Address',
    method: 'COD',
    note: '',
    totalAmount: 1,
    buyerId: 'forged',
  }
  await expect(createCheckout(input)).resolves.toEqual(checkout)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/checkout-groups', {
    orderItems: [{ productId: 'one' }, { productId: 'two' }],
    receiverName: 'Chu',
    phoneNumber: '0901234567',
    shippingAddress: 'Address',
    method: 'COD',
    note: '',
  })
})
test('forwards a trimmed voucherCode when provided', async () => {
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue(response)
  await expect(
    createCheckout({
      productIds: ['one'],
      receiverName: 'Chu',
      phoneNumber: '0901234567',
      shippingAddress: 'Address',
      method: 'COD',
      note: '',
      voucherCode: '  SAVE10  ',
    }),
  ).resolves.toEqual(checkout)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/checkout-groups', {
    orderItems: [{ productId: 'one' }],
    receiverName: 'Chu',
    phoneNumber: '0901234567',
    shippingAddress: 'Address',
    method: 'COD',
    note: '',
    voucherCode: 'SAVE10',
  })
})
test('reloads an encoded checkout id and forwards cancellation', async () => {
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response)
  const signal = new AbortController().signal
  await expect(getCheckout({ checkoutId: 'checkout/id', signal })).resolves.toEqual(checkout)
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/checkout-groups/checkout%2Fid', { signal })
})
test('propagates a failed POST without retrying it', async () => {
  const error = new Error('Response lost')
  const post = vi.spyOn(apiClient, 'post').mockRejectedValue(error)
  await expect(createCheckout({ productIds: ['one'] })).rejects.toBe(error)
  expect(post).toHaveBeenCalledTimes(1)
})
