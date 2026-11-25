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

/**
 * @param {{ email: string, password: string, fullName: string, phone?: string }} account
 * @returns {Promise<{ userId: string, email: string, fullName: string, status: string }>}
 */
export async function registerAccount({ email, password, fullName, phone }) {
  const response = await apiClient.post('/api/v1/auth/register', {
    email,
    password,
    fullName,
    phone,
  })

  return unwrap(response)
}

/** @param {{ email: string, code: string }} verification */
export async function verifyEmail({ email, code }) {
  const response = await apiClient.post('/api/v1/auth/verify-email', {
    email,
    code,
  })
  unwrap(response)
}

/** @param {{ email: string }} account */
export async function resendVerification({ email }) {
  const response = await apiClient.post('/api/v1/auth/resend-verification', { email })

  unwrap(response)
}

/** @param {{ email: string }} account */
export async function forgotPassword({ email }) {
  const response = await apiClient.post('/api/v1/auth/forgot-password', { email })
  unwrap(response)
}

/** @param {{ email: string, code: string, newPassword: string }} payload */
export async function resetPassword({ email, code, newPassword }) {
  const response = await apiClient.post('/api/v1/auth/reset-password', {
    email,
    code,
    newPassword,
  })
  unwrap(response)
}
