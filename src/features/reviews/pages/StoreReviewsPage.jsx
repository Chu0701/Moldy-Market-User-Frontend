import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useStoreReviews } from '@/features/reviews/hooks/useReviews'
import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { cn } from '@/lib/utils'

const STARS = [1, 2, 3, 4, 5]
const DISTRIBUTION_LEVELS = [5, 4, 3, 2, 1]

export function StoreReviewsPage() {
  const { t, i18n } = useTranslation()
  const storeQuery = useMyStore()
  const storeId = storeQuery.data?.id
  const reviewsQuery = useStoreReviews(storeId)

  if (storeQuery.isPending) {
    return <p role="status">{t('stores.loading')}</p>
  }

  if (storeQuery.isError) {
    if (storeQuery.error?.status === 403) return <ForbiddenState />
    if (storeQuery.error?.status === 404) {
      return (
        <section className="grid gap-4">
          <h1>{t('reviews.storeDashboardTitle')}</h1>
          <EmptyState
            title={t('stores.noStoreTitle')}
            description={t('stores.noStoreDescription')}
          />
          <Button asChild className="justify-self-start">
            <Link to="/open-store">{t('stores.open.title')}</Link>
          </Button>
        </section>
      )
    }
    return (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void storeQuery.refetch()}
        isRetrying={storeQuery.isFetching}
      />
    )
  }

  if (reviewsQuery.isPending) {
    return <p role="status">{t('reviews.loading')}</p>
  }

  if (reviewsQuery.isError) {
    return (
      <ErrorState
        title={t('reviews.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void reviewsQuery.refetch()}
        isRetrying={reviewsQuery.isFetching}
      />
    )
  }

  const { averageRating = 0, reviewCount = 0, reviews = [] } = reviewsQuery.data ?? {}
  const positiveCount = reviews.filter((item) => item.rating >= 4).length
  const positivePercent = reviewCount > 0 ? Math.round((positiveCount / reviewCount) * 100) : 0

  return (
    <section className="grid min-w-0 gap-6" aria-labelledby="store-reviews-dashboard-title">
      <div>
        <h1 id="store-reviews-dashboard-title" className="text-3xl font-semibold">
          {t('reviews.storeDashboardTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('reviews.storeDashboardSubtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface-subtle p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t('reviews.averageRating')}
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-foreground tabular-nums">
            <Star aria-hidden="true" className="size-5 fill-warning text-warning" />
            <span>{Number(averageRating).toFixed(1)}</span>
            <span className="text-sm font-normal text-muted-foreground">/ 5</span>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-subtle p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t('reviews.totalReviews')}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{reviewCount}</p>
        </div>

        <div className="rounded-lg border border-border bg-surface-subtle p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t('reviews.positiveRate')}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{positivePercent}%</p>
        </div>
      </div>

      {reviewCount === 0 ? (
        <EmptyState
          title={t('reviews.emptyStoreTitle')}
          description={t('reviews.emptyStoreDescription')}
        />
      ) : (
        <>
          <div className="grid gap-2 rounded-lg border border-border bg-card p-5">
            {DISTRIBUTION_LEVELS.map((level) => {
              const count = reviews.filter((item) => item.rating === level).length
              const width = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0
              return (
                <div
                  key={level}
                  className="grid grid-cols-[3rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm"
                >
                  <span className="inline-flex items-center gap-1 font-medium tabular-nums">
                    {level}
                    <Star aria-hidden="true" className="size-3.5 fill-warning text-warning" />
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-right text-xs text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>

          <ul className="grid gap-4">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="grid gap-2.5 rounded-lg border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{review.buyerName}</p>
                  {review.createdAt && (
                    <time className="text-xs text-muted-foreground tabular-nums">
                      {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
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
        </>
      )}
    </section>
  )
}
