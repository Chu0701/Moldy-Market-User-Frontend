import { useState } from 'react'
import { MessageSquareReply, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { ReviewDistributionFilter } from '@/features/reviews/components/ReviewDistributionFilter'
import { filterReviews } from '@/features/reviews/filterReviews'
import { useReplyToStoreReview, useStoreReviews } from '@/features/reviews/hooks/useReviews'
import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { cn } from '@/lib/utils'

const STARS = [1, 2, 3, 4, 5]

export function StoreReviewsPage() {
  const { t, i18n } = useTranslation()
  const { pushToast } = useToast()
  const storeQuery = useMyStore()
  const storeId = storeQuery.data?.id
  const reviewsQuery = useStoreReviews(storeId)
  const replyMutation = useReplyToStoreReview(storeId)
  const [activeFilter, setActiveFilter] = useState('all')
  const [replyingId, setReplyingId] = useState(null)
  const [replyDraft, setReplyDraft] = useState('')

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
  const visibleReviews = filterReviews(reviews, activeFilter)

  function openReplyEditor(review) {
    setReplyingId(review.id)
    setReplyDraft(review.sellerReply ?? '')
  }

  function closeReplyEditor() {
    setReplyingId(null)
    setReplyDraft('')
  }

  function handleSubmitReply(event, reviewId) {
    event.preventDefault()
    const trimmed = replyDraft.trim()
    if (!trimmed || replyMutation.isPending) return

    replyMutation.mutate(
      { reviewId, reply: trimmed },
      {
        onSuccess: () => {
          pushToast(t('reviews.reply.savedToast'), 'success')
          closeReplyEditor()
        },
        onError: () => {
          pushToast(t('reviews.reply.submitError'), 'error')
        },
      },
    )
  }

  return (
    <section className="grid min-w-0 gap-6 pt-2" aria-labelledby="store-reviews-dashboard-title">
      <div>
        <h1 id="store-reviews-dashboard-title" className="text-2xl font-semibold sm:text-3xl">
          {t('reviews.storeDashboardTitle')}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t('reviews.storeDashboardSubtitle')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-subtle p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t('reviews.averageRating')}
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-foreground tabular-nums">
            <Star aria-hidden="true" className="size-5 fill-warning text-warning" />
            <span>{Number(averageRating).toFixed(1)}</span>
            <span className="text-sm font-normal text-muted-foreground">/ 5</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-subtle p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t('reviews.totalReviews')}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{reviewCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface-subtle p-4">
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
          <ReviewDistributionFilter
            averageRating={averageRating}
            reviewCount={reviewCount}
            reviews={reviews}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {visibleReviews.length === 0 ? (
            <EmptyState
              title={t('reviews.filters.emptyTitle')}
              description={t('reviews.filters.emptyDescription')}
            />
          ) : (
            <ul className="grid gap-3">
              {visibleReviews.map((review) => {
                const isEditingReply = replyingId === review.id
                return (
                  <li
                    key={review.id}
                    className="grid gap-2.5 rounded-xl border border-border bg-card p-4 sm:p-5"
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

                    {review.sellerReply && !isEditingReply && (
                      <div className="mt-1 rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-foreground">
                            {t('reviews.reply.storeBadge')}
                          </span>
                          {review.repliedAt && (
                            <time className="text-muted-foreground tabular-nums">
                              {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              }).format(new Date(review.repliedAt))}
                            </time>
                          )}
                        </div>
                        <p className="mt-1 leading-6 break-words whitespace-pre-wrap text-muted-foreground">
                          {review.sellerReply}
                        </p>
                      </div>
                    )}

                    {isEditingReply ? (
                      <form
                        onSubmit={(event) => handleSubmitReply(event, review.id)}
                        className="mt-1 grid gap-2.5 rounded-lg border border-border bg-surface-subtle p-3"
                      >
                        <label
                          htmlFor={`reply-${review.id}`}
                          className="text-xs font-medium text-foreground"
                        >
                          {t('reviews.reply.fieldLabel')}
                        </label>
                        <textarea
                          id={`reply-${review.id}`}
                          rows={3}
                          maxLength={1000}
                          required
                          disabled={replyMutation.isPending}
                          value={replyDraft}
                          onChange={(event) => setReplyDraft(event.target.value)}
                          placeholder={t('reviews.reply.placeholder')}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={replyMutation.isPending}
                            onClick={closeReplyEditor}
                          >
                            {t('actions.cancel')}
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={replyMutation.isPending || !replyDraft.trim()}
                          >
                            {t(
                              replyMutation.isPending
                                ? 'reviews.reply.submitting'
                                : 'reviews.reply.submit',
                            )}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openReplyEditor(review)}
                        >
                          <MessageSquareReply aria-hidden="true" className="size-3.5" />
                          <span>
                            {t(
                              review.sellerReply
                                ? 'reviews.reply.editAction'
                                : 'reviews.reply.action',
                            )}
                          </span>
                        </Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
