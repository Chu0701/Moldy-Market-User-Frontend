import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { getPublicStore } from './storeService'

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
