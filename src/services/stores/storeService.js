import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * @typedef {{
 *  id: string,
 *  ownerId?: string,
 *  name: string,
 *  description: string | null,
 *  createdAt: string
 * }} PublicStore
 */

/**
 * @param {{ storeId: string, signal?: AbortSignal }} options
 * @returns {Promise<PublicStore | undefined>}
 */

export async function getPublicStore({ storeId, signal }) {
  const response = await apiClient.get(`/api/v1/stores/${encodeURIComponent(storeId)}`, {
    signal,
  })

  return unwrap(response)
}

/**
 * @param
 */
export async function getMyStore({ signal } = {}) {
  const response = await apiClient.get('/api/v1/stores/my-store', { signal })

  return unwrap(response)
}

/** @param {{ signal?: AbortSignal }} [options] */
export async function getMyStaffProfile({ signal } = {}) {
  const response = await apiClient.get('/api/v1/stores/my-store/staff/me', { signal })
  return unwrap(response)
}

/**
 * @param {{ name: string, description?: string, pickupAddress?: string }} store
 */
export async function createStore({ name, description, pickupAddress }) {
  const response = await apiClient.post('/api/v1/stores', {
    name,
    description,
    pickupAddress,
  })

  return unwrap(response)
}

/**
 * @param {{ name: string, description: string | null, pickupAddress: string | null }} store
 */
export async function updateMyStore({ name, description, pickupAddress }) {
  const response = await apiClient.put('/api/v1/stores/my-store', {
    name,
    description,
    pickupAddress,
  })

  return unwrap(response)
}

/**
 * @typedef {{ id: string, fullName: string | null, email: string, permissions: string[] }} StoreStaff
 */

/**
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<StoreStaff[]>}
 */
export async function getStoreStaff({ signal } = {}) {
  const response = await apiClient.get('/api/v1/stores/my-store/staff', { signal })
  return unwrap(response)
}

/**
 * @param {{ email: string}} staff
 * @returns {Promise<StoreStaff>}
 */
export async function addStoreStaff({ email }) {
  const response = await apiClient.post('/api/v1/stores/my-store/staff', {
    email,
    permissions: [],
  })

  return unwrap(response)
}

/**
 * @param {{ staffId: string, permissions: string[] }} changes
 * @returns {Promise<StoreStaff>}
 */
export async function updateStoreStaffPermissions({ staffId, permissions }) {
  const response = await apiClient.put(
    `/api/v1/stores/my-store/staff/${encodeURIComponent(staffId)}/permissions`,
    { permissions },
  )

  return unwrap(response)
}

/** @param {{ staffId: string }} staff */
export async function removeStoreStaff({ staffId }) {
  const response = await apiClient.delete(
    `/api/v1/stores/my-store/staff/${encodeURIComponent(staffId)}`,
  )

  unwrap(response)
}
