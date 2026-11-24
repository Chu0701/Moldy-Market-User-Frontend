import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStoreReviews } from '@/features/reviews/hooks/useReviews'
import { cn } from '@/lib/utils'

const STARS = [1, 2, 3, 4, 5]

/** @param {{ storeId?: string | null }} props */
export function StoreReviewsSection({ storeId }) {
  const { t, i18n } = useTranslation()
  const query = useStoreReviews(storeId)

  if (!storeId || !query.isSuccess) {
    return null
  }

  const { averageRating = 0, reviewCount = 0, reviews = [] } = query.data ?? {}

  if (reviewCount === 0) {
    return null
  }

  return (
    <section aria-labelledby="store-reviews-heading" className="mt-12 border-t border-border pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="store-reviews-heading" className="text-2xl font-semibold">
            {t('reviews.storeTitle')}
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground tabular-nums">
              <Star aria-hidden="true" className="size-4 fill-warning text-warning" />
              {Number(averageRating).toFixed(1)}
            </span>
            <span>{t('reviews.countLabel', { count: reviewCount })}</span>
          </p>
        </div>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {reviews.slice(0, 10).map((review) => (
          <li
            key={review.id}
            className="grid gap-2.5 rounded-lg border border-border bg-surface-subtle p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{review.buyerName}</p>
              {review.createdAt && (
                <time className="text-xs text-muted-foreground tabular-nums">
                  {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                    dateStyle: 'medium',
                  }).format(new Date(review.createdAt))}
                </time>
              )}
            </div>

            <div
              className="flex items-center gap-0.5"
              aria-label={t('reviews.starsLabel', { count: review.rating })}
            >
              {STARS.map((star) => (
                <Star
                  key={star}
                  aria-hidden="true"
                  className={cn(
                    'size-4',
                    star <= review.rating
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground/40',
                  )}
                />
              ))}
            </div>

            {review.comment && (
              <p className="max-w-prose text-sm leading-6 break-words whitespace-pre-wrap text-foreground/90">
                {review.comment}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
