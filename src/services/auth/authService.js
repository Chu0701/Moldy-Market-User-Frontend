import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

const authRequestConfig = {
  headers: { 'X-Moldy-Auth': '1' },
  withCredentials: true,
}

/**
 * @typedef {{
 *  userId: string,
 *  email: string,
 *  fullName: string,
 *  accessToken: string,
 *  tokenType: string
 * }} AccessTokenResponse
 */

/**
 * @param {{ email: string, password: string }} credentitials
 * @returns {Promise<AccessTokenResponse | undefined>}
 */
export async function login({ email, password }) {
  const response = await apiClient.post(
    '/api/v1/auth/login',
    { email, password },
    authRequestConfig,
  )

  return unwrap(response)
}

/** @returns {Promise<AccessTokenResponse | undefined?} */
export async function refreshSession() {
  const response = await apiClient.post('/api/v1/auth/refresh', undefined, authRequestConfig)

  return unwrap(response)
}

export async function logout() {
  const response = await apiClient.post('/api/v1/auth/logout', undefined, authRequestConfig)
  unwrap(response)
}
