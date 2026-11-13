const allowedSorts = ['relevance', 'newest', 'price_asc', 'price_desc']
const allowedConditions = ['NEW', 'LIKE_NEW', 'USED', 'DAMAGED']
const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i

/** @param {string|null} value @param {number} fallback */
function positiveInteger(value, fallback) {
  const number = Number(value)

  return Number.isSafeInteger(number) && number > 0 ? number : fallback
}

/** @param {string | null} value */
function readPrice(value) {
  const text = value?.trim() ?? ''
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return undefined

  const price = Number(text)
  return Number.isFinite(price) ? price : undefined
}

/** @param {URLSearchParams} searchParams */
export function readProductSearchParams(searchParams) {
  const q = (searchParams.get('q') ?? '').trim().slice(0, 100)
  const requestedSort = searchParams.get('sort')

  const categoryIds = [
    ...new Set(searchParams.getAll('categoryId').filter((id) => uuidPattern.test(id))),
  ].slice(0, 20)

  const conditions = [
    ...new Set(
      searchParams.getAll('condition').filter((value) => allowedConditions.includes(value)),
    ),
  ]

  const minPrice = readPrice(searchParams.get('minPrice'))
  const maxPrice = readPrice(searchParams.get('maxPrice'))
  const invertedRange = minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice

  return {
    q: q || undefined,
    categoryId: categoryIds.length ? categoryIds : undefined,
    condition: conditions.length ? conditions : undefined,
    minPrice: invertedRange ? undefined : minPrice,
    maxPrice: invertedRange ? undefined : maxPrice,
    page: positiveInteger(searchParams.get('page'), 1),
    size: Math.min(positiveInteger(searchParams.get('size'), 20), 100),
    sort: allowedSorts.includes(requestedSort) ? requestedSort : 'relevance',
  }
}
