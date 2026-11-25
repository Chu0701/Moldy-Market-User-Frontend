/**
 * Filter a list of store reviews by `'all'`, `'withComment'`, or star rating (`1`..`5`).
 *
 * @param {Array<{ rating: number, comment?: string | null }>} reviews
 * @param {'all' | 'withComment' | number} activeFilter
 */
export function filterReviews(reviews, activeFilter) {
  if (!Array.isArray(reviews)) return []
  if (activeFilter === 'all') return reviews
  if (activeFilter === 'withComment') {
    return reviews.filter((item) => Boolean(item.comment && item.comment.trim()))
  }
  if (typeof activeFilter === 'number') {
    return reviews.filter((item) => item.rating === activeFilter)
  }
  return reviews
}
