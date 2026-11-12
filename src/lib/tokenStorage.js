const ACCESS_TOKEN_KEY = 'moldy-market:user:access-token'
const AccessTokenEvents = new EventTarget()

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

/** @param {() => void} listener */
export function subscribeToAccessToken(listener) {
  AccessTokenEvents.addEventListener('change', listener)
  return () => AccessTokenEvents.removeEventListener('change', listener)
}

/** @param {string} token */
export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  AccessTokenEvents.dispatchEvent(new Event('change'))
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  AccessTokenEvents.dispatchEvent(new Event('change'))
}
