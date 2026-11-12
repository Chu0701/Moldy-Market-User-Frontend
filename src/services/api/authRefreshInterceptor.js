import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/tokenStorage'
import { refreshSession } from '@/services/auth/authService'
import { apiClient } from '@/services/api/client'

/** @param {() => void} onSessionExpired */
export function installAuthRefreshInterceptor(onSessionExpired) {
  let lastRotation

  function expireSession(token) {
    if (getAccessToken() !== token) return

    lastRotation = undefined
    clearAccessToken()
    onSessionExpired()
  }

  async function refreshAccessToken(previousToken) {
    try {
      const session = await refreshSession()

      if (!session?.accessToken) {
        throw new Error('Refresh response is missing an access token')
      }

      if (getAccessToken() !== previousToken) return undefined

      setAccessToken(session.accessToken)
      lastRotation = { from: previousToken, to: session.accessToken }
      return session.accessToken
    } catch (error) {
      if (error?.status === 401) expireSession(previousToken)
      throw error
    }
  }

  const interceptorId = apiClient.interceptors.response.use(undefined, async (error) => {
    const config = error?.response?.config
    const currentToken = getAccessToken()

    if (
      error?.status !== 401 ||
      !config ||
      !currentToken ||
      config.url?.startsWith('/api/v1/auth/')
    ) {
      throw error
    }

    const sentAuthorization = config.headers.get('Authorization')
    const usedCurrentToken = sentAuthorization === `Bearer ${currentToken}`

    if (config._authRetried) {
      if (usedCurrentToken) expireSession(currentToken)
      throw error
    }

    let nextToken = currentToken

    if (usedCurrentToken) {
      pendingRefresh ??= refreshAccessToken(currentToken).finally(() => {
        pendingRefresh = undefined
      })
      nextToken = await pendingRefresh
    } else if (
      !lastRotation ||
      lastRotation.to !== currentToken ||
      sentAuthorization !== `Bearer ${lastRotation.from}`
    ) {
      throw error
    }

    if (!nextToken || getAccessToken() !== nextToken) throw error

    config.headers.set('Authorization', `Bearer ${nextToken}`)
    return apiClient.request({ ...config, _authRetried: true })
  })

  return () => apiClient.interceptors.response.eject(interceptorId)
}

let pendingRefresh
export async function waitForPendingRefresh() {
  await pendingRefresh?.catch(() => undefined)
}
