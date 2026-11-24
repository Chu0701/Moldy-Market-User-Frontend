import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ id: string, email: string, fullName: string, avatarUrl?: string | null, trustPoints?: number, roles: string[] } | undefined>}
 */
export async function getMe({ signal } = {}) {
  const response = await apiClient.get('/api/v1/users/me', { signal })
  return unwrap(response)
}

/**
 * @param {{ fullName: string, phone?: string, avatarUrl?: string }} profile
 */
export async function updateMyProfile({ fullName, phone, avatarUrl }) {
  const response = await apiClient.put('/api/v1/users/me', {
    fullName,
    phone,
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
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
