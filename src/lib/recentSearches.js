const STORAGE_KEY = 'moldy_recent_searches'
const MAX_RECENT_SEARCHES = 5

/** @returns {string[]} */
export function getRecentSearches() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .slice(0, MAX_RECENT_SEARCHES)
  } catch {
    return []
  }
}

/**
 * @param {string} term
 * @returns {string[]}
 */
export function saveRecentSearch(term) {
  const cleaned = term.trim()
  if (!cleaned) return getRecentSearches()

  const normalized = cleaned.toLowerCase()
  const existing = getRecentSearches().filter((item) => item.toLowerCase() !== normalized)
  const next = [cleaned, ...existing].slice(0, MAX_RECENT_SEARCHES)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage quota or private-mode errors
  }

  return next
}

/**
 * @param {string} term
 * @returns {string[]}
 */
export function removeRecentSearch(term) {
  const normalized = term.trim().toLowerCase()
  const next = getRecentSearches().filter((item) => item.toLowerCase() !== normalized)

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage errors
  }

  return next
}

/** @returns {string[]} */
export function clearRecentSearches() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }

  return []
}
