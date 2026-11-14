import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 *  @param {{ signal?: AbortSignal }} [options]
 *  @returns {Promise<{ id: string, email: string, fullName: string, roles: string[] } | undefined}
 */

export async function getMe({ signal } = {}) {
  const response = await apiClient.get('/api/v1/users/me', { signal })
  return unwrap(response)
}

/**
 * @param {{ fullName: string, phone?: string }} profile
 */
export async function updateMyProfile({ fullName, phone }) {
  const response = await apiClient.put('/api/v1/users/me', {
    fullName,
    phone,
  })

  return unwrap(response)
}

/**
 * @param {{ currentPassword: string, newPassword: string }} passwords
 */
export async function changePassword({ currentPassword, newPassword }) {
  const response = await apiClient.put('/api/v1/users/me/password', {
    currentPassword,
    newPassword,
  })

  unwrap(response)
}
