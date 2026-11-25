const STORAGE_KEY = 'moldy.compare.v1'
const EVENT_NAME = 'moldy:compare-changed'
export const MAX_COMPARE_ITEMS = 3

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   price: number,
 *   imageUrl?: string,
 *   condition?: string,
 *   status?: string,
 *   storeId?: string | null,
 *   attributes?: Record<string, unknown> | null,
 * }} CompareProductItem
 */

/** @returns {CompareProductItem[]} */
export function readCompareProducts() {
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

/**
 * Toggle a product in the comparison list (max 3 items).
 * @param {CompareProductItem} product
 * @returns {{ status: 'added' | 'removed' | 'full', items: CompareProductItem[] }}
 */
export function toggleCompareProduct(product) {
  if (!product?.id || !product?.title) {
    return { status: 'removed', items: readCompareProducts() }
  }
  const existing = readCompareProducts()
  const alreadyPresent = existing.some((item) => item.id === product.id)

  if (alreadyPresent) {
    const next = existing.filter((item) => item.id !== product.id)
    writeCompareProducts(next)
    return { status: 'removed', items: next }
  }

  if (existing.length >= MAX_COMPARE_ITEMS) {
    return { status: 'full', items: existing }
  }

  const next = [
    ...existing,
    {
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl || undefined,
      condition: product.condition || undefined,
      status: product.status || undefined,
      storeId: product.storeId ?? null,
      attributes:
        product.attributes && typeof product.attributes === 'object' ? product.attributes : null,
    },
  ]
  writeCompareProducts(next)
  return { status: 'added', items: next }
}

/** @param {string} productId */
export function removeCompareProduct(productId) {
  const next = readCompareProducts().filter((item) => item.id !== productId)
  writeCompareProducts(next)
  return next
}

export function clearCompareProducts() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Ignore storage errors.
  }
}

/** @param {CompareProductItem[]} items */
function writeCompareProducts(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Ignore storage quota or restricted environment errors.
  }
}

/** @param {() => void} listener */
export function subscribeCompareProducts(listener) {
  window.addEventListener(EVENT_NAME, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT_NAME, listener)
    window.removeEventListener('storage', listener)
  }
}
