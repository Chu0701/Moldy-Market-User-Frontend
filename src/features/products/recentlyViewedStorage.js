const STORAGE_KEY = 'moldy.recentlyViewed.v1'
const EVENT_NAME = 'moldy:recently-viewed-changed'
const MAX_ITEMS = 8

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   price: number,
 *   imageUrl?: string,
 *   condition?: string,
 *   createdAt?: string,
 * }} RecentlyViewedItem
 */

/** @returns {RecentlyViewedItem[]} */
export function readRecentlyViewed() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item.id === 'string' && item.title)
  } catch {
    return []
  }
}

/** @param {RecentlyViewedItem} product */
export function recordRecentlyViewed(product) {
  if (!product?.id || !product?.title) return
  try {
    const existing = readRecentlyViewed().filter((item) => item.id !== product.id)
    const next = [
      {
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl || undefined,
        condition: product.condition || undefined,
        createdAt: product.createdAt || undefined,
      },
      ...existing,
    ].slice(0, MAX_ITEMS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Ignore storage quota or restricted environment errors.
  }
}

export function clearRecentlyViewed() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Ignore storage errors.
  }
}

/** @param {RecentlyViewedItem[]} items */
export function restoreRecentlyViewed(items) {
  if (!Array.isArray(items) || items.length === 0) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Ignore storage errors.
  }
}

/** @param {() => void} listener */
export function subscribeRecentlyViewed(listener) {
  window.addEventListener(EVENT_NAME, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT_NAME, listener)
    window.removeEventListener('storage', listener)
  }
}
