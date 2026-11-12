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
