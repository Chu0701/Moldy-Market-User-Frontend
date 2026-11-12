import { AxiosError } from 'axios'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { installAuthRefreshInterceptor, waitForPendingRefresh } from './authRefreshInterceptor'
import { apiClient } from './client'

const refreshUrl = '/api/v1/auth/refresh'
const profileUrl = '/api/v1/users/me'
const oldToken = 'expired-access-token'
const newToken = 'refreshed-access-token'
const originalAdapter = apiClient.defaults.adapter
const onSessionExpired = vi.fn()
let removeInterceptor

function success(config, data) {
  return { config, data, status: 200, statusText: 'OK', headers: {} }
}

function unauthorized(config, code = 'UNAUTHENTICATED') {
  const response = { ...success(config, { code }), status: 401 }
  return new AxiosError('Unauthorized', AxiosError.ERR_BAD_REQUEST, config, undefined, response)
}

function refreshSuccess(config) {
  return success(config, {
    success: true,
    code: 'SUCCESS',
    data: { accessToken: newToken },
  })
}

beforeEach(() => {
  onSessionExpired.mockClear()
  setAccessToken(oldToken)
  removeInterceptor = installAuthRefreshInterceptor(onSessionExpired)
})

afterEach(() => {
  removeInterceptor?.()
  apiClient.defaults.adapter = originalAdapter
  clearAccessToken()
})

test('shares one refresh across concurrent 401s and retries each request with the new token', async () => {
  const refresh = Promise.withResolvers()
  const refreshRequest = vi.fn(async (config) => {
    await refresh.promise
    return refreshSuccess(config)
  })
  const profileRequest = vi.fn(async (config) => {
    if (config.headers.get('Authorization') !== 'Bearer ' + newToken) throw unauthorized(config)
    return success(config, { id: 'test-user' })
  })
  apiClient.defaults.adapter = (config) =>
    config.url === refreshUrl ? refreshRequest(config) : profileRequest(config)

  const results = Promise.allSettled([apiClient.get(profileUrl), apiClient.get(profileUrl)])

  await vi.waitFor(() => expect(refreshRequest).toHaveBeenCalledOnce())
  expect(profileRequest).toHaveBeenCalledTimes(2)

  const refreshSettled = vi.fn()
  const waiting = waitForPendingRefresh().then(refreshSettled)
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(refreshSettled).not.toHaveBeenCalled()

  refresh.resolve()
  await waiting

  expect(await results).toEqual([
    expect.objectContaining({
      status: 'fulfilled',
      value: expect.objectContaining({ status: 200 }),
    }),
    expect.objectContaining({
      status: 'fulfilled',
      value: expect.objectContaining({ status: 200 }),
    }),
  ])
  expect(refreshRequest).toHaveBeenCalledOnce()
  expect(profileRequest).toHaveBeenCalledTimes(4)
  expect(getAccessToken()).toBe(newToken)
  expect(onSessionExpired).not.toHaveBeenCalled()
})

test('retries a late 401 with the rotated token without refreshing again', async () => {
  const lateResponse = Promise.withResolvers()
  const lateRequestStarted = Promise.withResolvers()
  const refreshRequest = vi.fn(async (config) => refreshSuccess(config))

  apiClient.defaults.adapter = async (config) => {
    if (config.url === refreshUrl) return refreshRequest(config)
    if (config.headers.get('Authorization') === 'Bearer ' + newToken) {
      return success(config, { id: 'test-user' })
    }
    if (config.params?.late) {
      lateRequestStarted.resolve()
      await lateResponse.promise
    }
    throw unauthorized(config)
  }

  const late = apiClient.get(profileUrl, { params: { late: true } })
  const lateResult = expect(late).resolves.toHaveProperty('status', 200)
  await lateRequestStarted.promise
  await expect(apiClient.get(profileUrl)).resolves.toHaveProperty('status', 200)
  lateResponse.resolve()

  await lateResult
  expect(refreshRequest).toHaveBeenCalledOnce()
})

test('clears the session when refresh returns 401 without refreshing recursively', async () => {
  const adapter = vi.fn(async (config) => {
    const code = config.url === refreshUrl ? 'REFRESH_TOKEN_INVALID' : undefined
    throw unauthorized(config, code)
  })
  apiClient.defaults.adapter = adapter

  await expect(apiClient.get(profileUrl)).rejects.toMatchObject({
    status: 401,
    code: 'REFRESH_TOKEN_INVALID',
  })

  expect(adapter).toHaveBeenCalledTimes(2)
  expect(getAccessToken()).toBeNull()
  expect(onSessionExpired).toHaveBeenCalledOnce()
})

test('keeps the access token when refresh fails because of a network error', async () => {
  apiClient.defaults.adapter = async (config) => {
    if (config.url === refreshUrl) throw new AxiosError('Offline', AxiosError.ERR_NETWORK, config)
    throw unauthorized(config)
  }

  await expect(apiClient.get(profileUrl)).rejects.toMatchObject({ code: 'FE_NETWORK_ERROR' })

  expect(getAccessToken()).toBe(oldToken)
  expect(onSessionExpired).not.toHaveBeenCalled()
})

test('expires the session without refreshing a second time when a retried request returns 401', async () => {
  const adapter = vi.fn(async (config) => {
    if (config.url === refreshUrl) return refreshSuccess(config)
    throw unauthorized(config)
  })
  apiClient.defaults.adapter = adapter

  await expect(apiClient.get(profileUrl)).rejects.toMatchObject({ status: 401 })

  expect(adapter.mock.calls.map(([config]) => config.url)).toEqual([
    profileUrl,
    refreshUrl,
    profileUrl,
  ])
  expect(getAccessToken()).toBeNull()
  expect(onSessionExpired).toHaveBeenCalledOnce()
})

test('skips refresh on login 401', async () => {
  const adapter = vi.fn(async (config) => {
    throw unauthorized(config, 'INVALID_CREDENTIALS')
  })
  apiClient.defaults.adapter = adapter

  await expect(apiClient.post('/api/v1/auth/login')).rejects.toMatchObject({
    status: 401,
    code: 'INVALID_CREDENTIALS',
  })

  expect(adapter).toHaveBeenCalledOnce()
  expect(getAccessToken()).toBe(oldToken)
  expect(onSessionExpired).not.toHaveBeenCalled()
})
