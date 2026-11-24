import { useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useCreateStoreReview, useOrderReview } from '@/features/reviews/hooks/useReviews'
import { cn } from '@/lib/utils'

const STARS = [1, 2, 3, 4, 5]

/** @param {{ order: object }} props */
export function OrderReviewPanel({ order }) {
  const { t } = useTranslation()
  const isCompleted = order?.status === 'COMPLETED'
  const reviewQuery = useOrderReview(order?.id, isCompleted)
  const createMutation = useCreateStoreReview()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)

  if (!isCompleted || !reviewQuery.isSuccess) {
    return null
  }

  const existingReview = reviewQuery.data

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage(null)

    try {
      await createMutation.mutateAsync({
        orderId: order.id,
        rating,
        comment,
      })
      setComment('')
    } catch (error) {
      setErrorMessage(
        error?.code === 'REVIEW_ALREADY_EXISTS'
          ? t('reviews.alreadySubmitted')
          : t('reviews.submitError'),
      )
    }
  }

  return (
    <section className="order-card" aria-labelledby="order-review-heading">
      <h2 id="order-review-heading">{t('reviews.orderTitle')}</h2>

      {existingReview ? (
        <div className="space-y-3">
          <div
            className="flex items-center gap-1"
            aria-label={t('reviews.starsLabel', { count: existingReview.rating })}
          >
            {STARS.map((star) => (
              <Star
                key={star}
                aria-hidden="true"
                className={cn(
                  'size-5',
                  star <= existingReview.rating
                    ? 'fill-warning text-warning'
                    : 'text-muted-foreground/40',
                )}
              />
            ))}
            <span className="ml-2 text-sm font-medium text-foreground tabular-nums">
              {existingReview.rating} / 5
            </span>
          </div>
          {existingReview.comment && (
            <p className="max-w-prose text-sm leading-6 break-words whitespace-pre-wrap text-foreground">
              {existingReview.comment}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t('reviews.submittedHint')}</p>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">{t('reviews.ratingLabel')}</legend>
            <div className="flex flex-wrap items-center gap-1.5">
              {STARS.map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={t('reviews.selectStar', { count: star })}
                  aria-pressed={rating === star}
                  onClick={() => setRating(star)}
                  className="inline-flex size-11 items-center justify-center rounded-md border border-border bg-background transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Star
                    aria-hidden="true"
                    className={cn(
                      'size-5',
                      star <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/40',
                    )}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-muted-foreground tabular-nums">
                {rating} / 5
              </span>
            </div>
          </fieldset>

          <div className="grid gap-2">
            <label htmlFor="order-review-comment" className="text-sm font-medium">
              {t('reviews.commentLabel')}
            </label>
            <textarea
              id="order-review-comment"
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={t('reviews.commentPlaceholder')}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="min-h-11 justify-self-start"
          >
            {t(createMutation.isPending ? 'reviews.submitting' : 'reviews.submit')}
          </Button>
        </form>
      )}
    </section>
  )
}
