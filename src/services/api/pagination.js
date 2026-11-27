/**
 * Normalizes a ProductSearchResponse for frontend pagination.
 * @template T
 * @param {{
 *   items: T[],
 *   page: number,
 *   size: number,
 *   totalElements: number,
 *   totalPages: number,
 *   totalCapped: boolean,
 *   facets: unknown
 * }} data
 */
export function normalizeProductSearchPage(data) {
  return {
    items: data.items,
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    totalCapped: data.totalCapped,
    facets: data.facets,
    hasNext: data.page < data.totalPages,
  }
}

export function normalizePagedResponse({ content, page, size, hasNext, totalElements }) {
  return { items: content, page, size, hasNext, totalElements }
}

/** Normalizes Spring Page metadata to the frontend's one-based page numbering. */
export function normalizeSpringPage({ content, number, size, totalElements, totalPages, last }) {
  return {
    items: content,
    page: number + 1,
    size,
    totalElements,
    totalPages,
    hasNext: !last,
  }
}

/**
 * Normalizes Offer PageResponse ({ currentPage, totalPages, pageSize, totalElements, data }).
 * @template T
 * @param {{
 *   currentPage?: number,
 *   totalPages?: number,
 *   pageSize?: number,
 *   totalElements?: number,
 *   data?: T[]
 * } | undefined} response
 */
export function normalizeOfferPage(response) {
  const page = response?.currentPage ?? 1
  const totalPages = response?.totalPages ?? 0
  return {
    items: response?.data ?? [],
    page,
    size: response?.pageSize ?? 10,
    totalElements: response?.totalElements ?? 0,
    totalPages,
    hasNext: page < totalPages,
  }
}
