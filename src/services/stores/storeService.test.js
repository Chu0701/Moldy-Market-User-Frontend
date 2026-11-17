import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { createStore, getMyStore, getPublicStore, updateMyStore } from './storeService'

afterEach(() => {
  vi.restoreAllMocks()
})

test('requests the public store by ID, forwards the abort signal, and unwraps the response', async () => {
  const store = {
    id: 'a8098c1a-f86e-11da-bd1a-00112444be1e',
    name: 'Test store',
    description: null,
    createdAt: '2026-11-10T00:00:00Z',
  }
  const { signal } = new AbortController()
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: store },
  })

  await expect(getPublicStore({ storeId: store.id, signal })).resolves.toEqual(store)
  expect(get).toHaveBeenCalledExactlyOnceWith(`/api/v1/stores/${store.id}`, { signal })
})

test('requests the current user’s store and forwards the abort signal', async () => {
  const store = { id: 'my-store', name: 'My store' }
  const { signal } = new AbortController()
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: store },
  })

  await expect(getMyStore({ signal })).resolves.toEqual(store)
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/stores/my-store', { signal })
})

test('sends the store name, description and pickup address when creating a store', async () => {
  const input = { name: 'My store', description: 'Used books', pickupAddress: '123 Main St' }
  const store = { id: 'new-store', ...input }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 201,
    data: { success: true, code: 'SUCCESS', data: store },
  })

  await expect(createStore(input)).resolves.toEqual(store)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/stores', input)
})

test('updates the current store and sends null to clear optional fields', async () => {
  const changes = { name: 'New store name', description: null, pickupAddress: null }
  const store = { id: 'my-store', ...changes }
  const put = vi.spyOn(apiClient, 'put').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: store },
  })

  await expect(updateMyStore(changes)).resolves.toEqual(store)
  expect(put).toHaveBeenCalledExactlyOnceWith('/api/v1/stores/my-store', changes)
})
