import axios, { AxiosError, CanceledError } from 'axios'
import { describe, expect, test } from 'vitest'

import { ApiError, FRONTEND_ERROR_CODES } from '@/services/api/ApiError'
import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

// These adapters exercise the real interceptors without making network requests.
function responseAdapter(data, status = 200) {
  return async (config) => ({ data, status, statusText: '', headers: {}, config })
}

describe('REST response handling', () => {
  test('preserves the envelope until the service explicitly unwraps it', async () => {
    const payload = { value: 'example' }
    const body = { success: true, code: 'SUCCESS', message: 'OK', data: payload }
    const response = await apiClient.request({ adapter: responseAdapter(body) })

    expect(response.data).toBe(body)
    expect(unwrap(response)).toBe(payload)
  })

  test.each([undefined, null, ''])('accepts an empty response body: %s', async (body) => {
    const response = await apiClient.request({ adapter: responseAdapter(body, 204) })
    expect(unwrap(response)).toBeUndefined()
  })

  test.each([null, false, 0, ''])('preserves a valid payload: %s', async (payload) => {
    const body = { success: true, code: 'SUCCESS', message: 'OK', data: payload }
    const response = await apiClient.request({ adapter: responseAdapter(body) })
    expect(unwrap(response)).toBe(payload)
  })

  test('rejects malformed bodies instead of hiding a contract or proxy problem', async () => {
    const response = await apiClient.request({
      adapter: responseAdapter('<html>Proxy error</html>'),
    })
    expect(() => unwrap(response)).toThrow(ApiError)
  })

  test('rejects an unsuccessful envelope even when the HTTP request resolved', async () => {
    const response = await apiClient.request({
      adapter: responseAdapter({ success: false, code: 'COMMON_010', message: 'Stale data' }),
    })

    expect(() => unwrap(response)).toThrow(expect.objectContaining({ code: 'COMMON_010' }))
  })
})

describe('error normalization', () => {
  test('retains HTTP status, Backend code, details and the original response', async () => {
    const details = { path: '/example' }
    let originalResponse
    const adapter = async (config) => {
      originalResponse = {
        config,
        status: 409,
        statusText: 'Conflict',
        headers: {},
        data: { success: false, code: 'COMMON_010', message: 'Stale data', data: details },
      }
      throw new AxiosError(
        'Request failed',
        AxiosError.ERR_BAD_REQUEST,
        config,
        {},
        originalResponse,
      )
    }

    const error = await apiClient.request({ adapter }).catch((failure) => failure)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: 'COMMON_010', message: 'Stale data', details })
    expect(error.response).toBe(originalResponse)
    expect(error.cause).toBeInstanceOf(AxiosError)
  })

  test('keeps the HTTP status when an error response has no envelope', async () => {
    const adapter = async (config) => {
      throw new AxiosError(
        'Request failed',
        AxiosError.ERR_BAD_RESPONSE,
        config,
        {},
        {
          config,
          status: 502,
          statusText: 'Bad Gateway',
          headers: {},
          data: 'Proxy unavailable',
        },
      )
    }

    await expect(apiClient.request({ adapter })).rejects.toMatchObject({
      status: 502,
      code: FRONTEND_ERROR_CODES.UNKNOWN,
    })
  })

  test('normalizes a network failure without inventing an HTTP status', async () => {
    const adapter = async () => {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK)
    }

    await expect(apiClient.request({ adapter })).rejects.toMatchObject({
      name: 'ApiError',
      status: null,
      code: FRONTEND_ERROR_CODES.NETWORK,
    })
  })

  test('normalizes unexpected failures and preserves already normalized errors', () => {
    const original = new Error('Unexpected failure')
    const error = ApiError.from(original)
    expect(error).toMatchObject({
      status: null,
      code: FRONTEND_ERROR_CODES.UNKNOWN,
      cause: original,
    })
    expect(ApiError.from(error)).toBe(error)
  })

  test('preserves cancellation so callers can distinguish it from a failed request', async () => {
    const cancellation = new CanceledError('Navigation cancelled')
    const adapter = async () => {
      throw cancellation
    }
    const error = await apiClient.request({ adapter }).catch((failure) => failure)

    expect(error).toBe(cancellation)
    expect(axios.isCancel(error)).toBe(true)
    expect(error).not.toBeInstanceOf(ApiError)
  })
})
