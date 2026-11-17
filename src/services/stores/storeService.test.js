import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import {
  addStoreStaff,
  createStore,
  getMyStore,
  getPublicStore,
  getStoreStaff,
  removeStoreStaff,
  updateMyStore,
  updateStoreStaffPermissions,
} from './storeService'

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

test('requests the current store staff and unwraps the array response', async () => {
  const staff = [{ id: 'staff-1', email: 'staff@example.com', permissions: ['PRODUCT_CREATE'] }]
  const { signal } = new AbortController()
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: staff },
  })

  await expect(getStoreStaff({ signal })).resolves.toEqual(staff)
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/v1/stores/my-store/staff', { signal })
})

test('adds a staff member by email without assigning business permissions', async () => {
  const email = 'staff@example.com'
  const staff = { id: 'staff-1', email, permissions: ['STORE_WORKSPACE_ACCESS'] }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 201,
    data: { success: true, code: 'SUCCESS', data: staff },
  })

  await expect(addStoreStaff({ email })).resolves.toEqual(staff)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/stores/my-store/staff', {
    email,
    permissions: [],
  })
})

test('encodes the staff ID and sends the complete permissions selection', async () => {
  const staff = { id: 'staff/1', permissions: ['STORE_WORKSPACE_ACCESS'] }
  const put = vi.spyOn(apiClient, 'put').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: staff },
  })

  await expect(
    updateStoreStaffPermissions({ staffId: staff.id, permissions: [] }),
  ).resolves.toEqual(staff)
  expect(put).toHaveBeenCalledExactlyOnceWith(
    '/api/v1/stores/my-store/staff/staff%2F1/permissions',
    {
      permissions: [],
    },
  )
})

test('removes a staff member by encoded ID and accepts the null success payload', async () => {
  const remove = vi.spyOn(apiClient, 'delete').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: null },
  })

  await expect(removeStoreStaff({ staffId: 'staff/1' })).resolves.toBeUndefined()
  expect(remove).toHaveBeenCalledExactlyOnceWith('/api/v1/stores/my-store/staff/staff%2F1')
})

test('rejects a failed remove-staff response envelope', async () => {
  vi.spyOn(apiClient, 'delete').mockResolvedValue({
    status: 200,
    data: { success: false, code: 'STAFF_NOT_FOUND', data: null },
  })

  await expect(removeStoreStaff({ staffId: 'staff-1' })).rejects.toMatchObject({
    code: 'STAFF_NOT_FOUND',
  })
})
