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
