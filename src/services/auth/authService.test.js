import { afterEach, expect, test, vi } from 'vitest'

import { apiClient } from '@/services/api/client'
import { login, logout, refreshSession } from './authService'

afterEach(() => {
  vi.restoreAllMocks()
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
