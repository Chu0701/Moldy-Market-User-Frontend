import { afterEach, expect, test, vi } from 'vitest'

import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { apiClient } from '@/services/api/client'
import { getMe } from './userService'

const originalAdapter = apiClient.defaults.adapter

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter
  clearAccessToken()
})

test('sends the stored access token and unwraps the current user profile', async () => {
  setAccessToken('test-access-token')
  const profile = {
    id: 'test-user',
    email: 'chu@example.com',
    fullName: 'Test User',
    roles: ['USER'],
  }
  const { signal } = new AbortController()
  const adapter = vi.fn(async (config) => ({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: profile },
    headers: {},
    config,
  }))
  apiClient.defaults.adapter = adapter

  const result = await getMe({ signal })

  expect(adapter).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ url: '/api/v1/users/me', method: 'get', signal }),
  )
  expect(adapter.mock.calls[0][0].headers.get('Authorization')).toBe('Bearer test-access-token')
  expect(result).toEqual(profile)
})

test('skips the stored access token on auth requests', async () => {
  setAccessToken('test-access-token')
  const response = await apiClient.post('/api/v1/auth/login', null, {
    adapter: async (config) => ({ status: 200, data: {}, headers: {}, config }),
  })

  expect(response.config.headers.has('Authorization')).toBe(false)
})
