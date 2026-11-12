const allowedSorts = ['relevance', 'newest', 'price_asc', 'price_desc']

/** @param {string|null} value @param {number} fallback */
function positiveInteger(value, fallback) {
  const number = Number(value)

  return Number.isSafeInteger(number) && number > 0 ? number : fallback
}

/** @param {URLSearchParams} searchParams */
export function readProductSearchParams(searchParams) {
  const q = (searchParams.get('q') ?? '').trim().slice(0, 100)
  const requestedSort = searchParams.get('sort')

  return {
    q: q || undefined,
    page: positiveInteger(searchParams.get('page'), 1),
    size: Math.min(positiveInteger(searchParams.get('size'), 20), 100),
    sort: allowedSorts.includes(requestedSort) ? requestedSort : 'relevance',
  }
}
