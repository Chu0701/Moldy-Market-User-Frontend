import { afterEach, expect, test, vi } from 'vitest'

import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { apiClient } from '@/services/api/client'
import { changePassword, getMe, updateMyProfile } from './userService'

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

test.each([
  { phone: '0912345678', expectedBody: { fullName: 'New Name', phone: '0912345678' } },
  { phone: undefined, expectedBody: { fullName: 'New Name' } },
])('updates the current profile with phone $phone', async ({ phone, expectedBody }) => {
  const updatedProfile = { id: 'test-user', ...expectedBody }
  const adapter = vi.fn(async (config) => ({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: updatedProfile },
    headers: {},
    config,
  }))
  apiClient.defaults.adapter = adapter

  await expect(updateMyProfile({ fullName: 'New Name', phone })).resolves.toEqual(updatedProfile)

  expect(adapter).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ url: '/api/v1/users/me', method: 'put' }),
  )
  expect(JSON.parse(adapter.mock.calls[0][0].data)).toEqual(expectedBody)
})

test('sends only the two password fields and accepts a null response payload', async () => {
  setAccessToken('test-access-token')
  const passwords = { currentPassword: ' old password ', newPassword: ' new password ' }
  const adapter = vi.fn(async (config) => ({
    status: 200,
    data: { success: true, code: 'SUCCESS', data: null },
    headers: {},
    config,
  }))
  apiClient.defaults.adapter = adapter

  await expect(
    changePassword({ ...passwords, confirmPassword: passwords.newPassword }),
  ).resolves.toBeUndefined()

  expect(adapter).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ url: '/api/v1/users/me/password', method: 'put' }),
  )
  const [config] = adapter.mock.calls[0]
  expect(config.headers.get('Authorization')).toBe('Bearer test-access-token')
  expect(JSON.parse(config.data)).toEqual(passwords)
})

test('skips the stored access token on auth requests', async () => {
  setAccessToken('test-access-token')
  const response = await apiClient.post('/api/v1/auth/login', null, {
    adapter: async (config) => ({ status: 200, data: {}, headers: {}, config }),
  })

  expect(response.config.headers.has('Authorization')).toBe(false)
})
