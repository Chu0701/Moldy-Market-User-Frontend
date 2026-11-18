import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { addCartItem, getCart, removeCartItem } from './cartService'

afterEach(() => vi.restoreAllMocks())

const cart = { id: 'cart-id', items: [], subtotal: 0, totalItems: 0 }
const response = { status: 200, data: { success: true, code: 'SUCCESS', data: cart } }

test('loads the cart with an abort signal and unwraps the response', async () => {
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue(response)
  const signal = new AbortController().signal
  await expect(getCart({ signal })).resolves.toEqual(cart)
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/carts', { signal })
})

test('adds exactly one product and leaves pricing to the backend', async () => {
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue(response)
  await expect(addCartItem({ productId: 'product-id', price: 1, quantity: 99 })).resolves.toEqual(
    cart,
  )
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/carts/items', {
    listingId: 'product-id',
    quantity: 1,
  })
})

test('encodes the listing id when removing and returns the updated cart', async () => {
  const remove = vi.spyOn(apiClient, 'delete').mockResolvedValue(response)
  await expect(removeCartItem({ productId: 'product/id' })).resolves.toEqual(cart)
  expect(remove).toHaveBeenCalledExactlyOnceWith('/api/v1/carts/items/product%2Fid')
})
