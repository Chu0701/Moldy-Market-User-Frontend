import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import {
  login,
  logout,
  refreshSession,
  registerAccount,
  resendVerification,
  verifyEmail,
} from './authService'

afterEach(() => {
  vi.restoreAllMocks()
})

test.each([
  [
    verifyEmail,
    '/api/v1/auth/verify-email',
    { email: 'chu@example.com', code: '012345', password: 'final-password' },
  ],
  [resendVerification, '/api/v1/auth/resend-verification', { email: 'chu@example.com' }],
])('sends the email verification request to its endpoint', async (request, path, payload) => {
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: null },
  })

  await expect(request(payload)).resolves.toBeUndefined()
  expect(post).toHaveBeenCalledExactlyOnceWith(path, payload)
})

test('registers an account using only the registration payload', async () => {
  const account = {
    email: 'chu@example.com',
    fullName: 'Chu',
    password: ' password ',
    phone: undefined,
  }
  const response = {
    userId: 'new-user',
    email: account.email,
    fullName: account.fullName,
    status: 'PENDING_VERIFICATION',
  }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 201,
    data: { success: true, code: 'SUCCESS', data: response },
  })
  await expect(registerAccount({ ...account, confirmPassword: 'extra' })).resolves.toEqual(response)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/auth/register', account)
})

test('posts credentials with the auth header and unwraps the access token response', async () => {
  const credentials = { email: 'chu@example.com', password: ' test password ' }
  const data = {
    userId: 'test-user',
    email: credentials.email,
    fullName: 'Test User',
    accessToken: 'test-access-token',
    tokenType: 'Bearer',
  }

  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data },
  })

  await expect(login(credentials)).resolves.toEqual(data)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/auth/login', credentials, {
    headers: { 'X-Moldy-Auth': '1' },
    withCredentials: true,
  })
})

test('refreshes with browser credentials and no token in the request body', async () => {
  const data = { accessToken: 'refreshed-access-token' }
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data },
  })

  await expect(refreshSession()).resolves.toEqual(data)
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/auth/refresh', undefined, {
    headers: { 'X-Moldy-Auth': '1' },
    withCredentials: true,
  })
})

test('logs out with browser credentials and no request body', async () => {
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: null },
  })

  await expect(logout()).resolves.toBeUndefined()
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/auth/logout', undefined, {
    headers: { 'X-Moldy-Auth': '1' },
    withCredentials: true,
  })
})
