import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ReviewDistributionFilter } from '@/features/reviews/components/ReviewDistributionFilter'
import { filterReviews } from '@/features/reviews/filterReviews'
import { useStoreReviews } from '@/features/reviews/hooks/useReviews'
import { cn } from '@/lib/utils'

const STARS = [1, 2, 3, 4, 5]

/** @param {{ storeId?: string | null }} props */
export function StoreReviewsSection({ storeId }) {
  const { t, i18n } = useTranslation()
  const query = useStoreReviews(storeId)
  const [activeFilter, setActiveFilter] = useState('all')

  if (!storeId || !query.isSuccess) {
    return null
  }

  const { averageRating = 0, reviewCount = 0, reviews = [] } = query.data ?? {}

  if (reviewCount === 0) {
    return null
  }

  const visibleReviews = filterReviews(reviews, activeFilter)

  return (
    <section
      aria-labelledby="store-reviews-heading"
      className="mt-12 space-y-5 border-t border-border pt-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
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

      <ReviewDistributionFilter
        averageRating={averageRating}
        reviewCount={reviewCount}
        reviews={reviews}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        showSummaryScore
      />

      {visibleReviews.length === 0 ? (
        <EmptyState
          title={t('reviews.filters.emptyTitle')}
          description={t('reviews.filters.emptyDescription')}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visibleReviews.slice(0, 12).map((review) => (
            <li
              key={review.id}
              className="grid gap-2.5 rounded-xl border border-border bg-surface-subtle p-4"
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

              {review.sellerReply && (
                <div className="mt-1 rounded-lg border border-border/80 bg-background px-3.5 py-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-foreground">
                      {t('reviews.reply.storeBadge')}
                    </span>
                    {review.repliedAt && (
                      <time className="text-muted-foreground tabular-nums">
                        {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                          dateStyle: 'medium',
                        }).format(new Date(review.repliedAt))}
                      </time>
                    )}
                  </div>
                  <p className="mt-1 leading-6 break-words whitespace-pre-wrap text-muted-foreground">
                    {review.sellerReply}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
