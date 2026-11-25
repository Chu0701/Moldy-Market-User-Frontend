import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChartNoAxesCombined, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import {
  useAppraiserReviews,
  useMyAppraiserCommission,
  useMyAppraiserCommissions,
  useMyAppraiserProfile,
} from '@/features/appraiser/hooks/useAppraiserData'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'

function ReviewList({ profile, userId, page, setPage, t, language }) {
  const reviewsQuery = useAppraiserReviews(userId, profile?.id, page)

  if (reviewsQuery.isPending) {
    return (
      <p
        role="status"
        className="rounded-lg border border-border p-4 text-sm text-muted-foreground"
      >
        {t('appraiser.performance.loadingReviews')}
      </p>
    )
  }
  if (reviewsQuery.isError) {
    return reviewsQuery.error?.status === 403 ? (
      <ForbiddenState />
    ) : (
      <ErrorState
        title={t('appraiser.performance.reviewsErrorTitle')}
        description={t('appraiser.performance.reviewsErrorDescription')}
        onRetry={() => void reviewsQuery.refetch()}
        isRetrying={reviewsQuery.isFetching}
      />
    )
  }
  if (reviewsQuery.data.items.length === 0) {
    return (
      <EmptyState
        title={t('appraiser.performance.reviewsEmptyTitle')}
        description={t('appraiser.performance.reviewsEmptyDescription')}
      />
    )
  }

  return (
    <div className="space-y-3">
      {reviewsQuery.data.items.map((review) => (
        <article key={review.id} className="rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">
              {t('appraiser.performance.rating', { rating: review.rating })}
            </p>
            <time className="text-xs text-muted-foreground">
              {formatLocalDate(review.createdAt, language)}
            </time>
          </div>
          {review.comment && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{review.comment}</p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
            {[
              ['accuracyScore', review.accuracyScore],
              ['professionalismScore', review.professionalismScore],
              ['communicationScore', review.communicationScore],
              ['timelinessScore', review.timelinessScore],
            ].map(([key, score]) => (
              <div key={key}>
                <dt className="text-muted-foreground">{t(`appraiser.performance.${key}`)}</dt>
                <dd className="mt-0.5 font-semibold">{score ?? '—'}/5</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
      {reviewsQuery.data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            {t('appraiser.queue.page', {
              page: reviewsQuery.data.page,
              totalPages: reviewsQuery.data.totalPages,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1 || reviewsQuery.isFetching}
              onClick={() => setPage((value) => value - 1)}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('appraiser.pagination.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!reviewsQuery.data.hasNext || reviewsQuery.isFetching}
              onClick={() => setPage((value) => value + 1)}
            >
              {t('appraiser.pagination.next')}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CommissionRow({ commission, language, t, userId }) {
  const [open, setOpen] = useState(false)
  const commissionQuery = useMyAppraiserCommission(userId, open ? commission.id : undefined)

  return (
    <article className="rounded-lg border border-border p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <AppraiserStatusBadge domain="commission" status={commission.status} />
            <span className="text-xs text-muted-foreground">
              {t('appraiser.performance.assignmentId', { id: commission.assignmentId })}
            </span>
          </div>
          <p className="mt-3 text-lg font-semibold tabular-nums">
            {formatVnd(commission.appraiserEarnings, language)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('appraiser.performance.earnedAt', {
              date: formatLocalDate(commission.calculatedAt, language),
            })}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen((value) => !value)}>
          {t(open ? 'appraiser.performance.hideDetails' : 'appraiser.performance.showDetails')}
        </Button>
      </div>
      {open && (
        <div className="mt-4 border-t border-border pt-4">
          {commissionQuery.isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t('appraiser.performance.loadingCommission')}
            </p>
          ) : commissionQuery.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {t('appraiser.performance.commissionDetailError')}
            </p>
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t('appraiser.performance.agreedFee')}
                </dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {formatVnd(commissionQuery.data.agreedFee, language)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t('appraiser.performance.appraiserEarnings')}
                </dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {formatVnd(commissionQuery.data.appraiserEarnings, language)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t('appraiser.performance.platformFee')}
                </dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {formatVnd(commissionQuery.data.platformFee, language)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t('appraiser.performance.paidAt')}
                </dt>
                <dd className="mt-1 font-medium">
                  {commissionQuery.data.paidAt
                    ? formatLocalDate(commissionQuery.data.paidAt, language)
                    : '—'}
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </article>
  )
}

function CommissionList({ userId, t, language }) {
  const commissionsQuery = useMyAppraiserCommissions(userId)

  if (commissionsQuery.isPending) {
    return (
      <p
        role="status"
        className="rounded-lg border border-border p-4 text-sm text-muted-foreground"
      >
        {t('appraiser.performance.loadingCommissions')}
      </p>
    )
  }
  if (commissionsQuery.isError) {
    return commissionsQuery.error?.status === 403 ? (
      <ForbiddenState />
    ) : (
      <ErrorState
        title={t('appraiser.performance.commissionsErrorTitle')}
        description={t('appraiser.performance.commissionsErrorDescription')}
        onRetry={() => void commissionsQuery.refetch()}
        isRetrying={commissionsQuery.isFetching}
      />
    )
  }
  if (commissionsQuery.data.length === 0) {
    return (
      <EmptyState
        title={t('appraiser.performance.commissionsEmptyTitle')}
        description={t('appraiser.performance.commissionsEmptyDescription')}
      />
    )
  }

  return (
    <div className="space-y-3">
      {commissionsQuery.data.map((commission) => (
        <CommissionRow
          key={commission.id}
          commission={commission}
          language={language}
          t={t}
          userId={userId}
        />
      ))}
    </div>
  )
}

export function AppraiserPerformancePage() {
  const { t, i18n } = useTranslation()
  const { profileQuery: sessionQuery } = useSession()
  const userId = sessionQuery.data?.id
  const profileQuery = useMyAppraiserProfile(userId)
  const [reviewPage, setReviewPage] = useState(1)

  return (
    <AppraiserPageShell
      title={t('appraiser.performance.title')}
      description={t('appraiser.performance.description')}
    >
      {profileQuery.isPending ? (
        <p
          role="status"
          className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground"
        >
          {t('appraiser.profile.loading')}
        </p>
      ) : profileQuery.isError ? (
        <ErrorState
          title={t('appraiser.profile.errorTitle')}
          description={t('appraiser.profile.errorDescription')}
          onRetry={() => void profileQuery.refetch()}
          isRetrying={profileQuery.isFetching}
        />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <ChartNoAxesCombined aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">{t('appraiser.performance.reviewsTitle')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('appraiser.performance.reviewsHint')}
                </p>
              </div>
            </div>
            <ReviewList
              profile={profileQuery.data}
              userId={userId}
              page={reviewPage}
              setPage={setReviewPage}
              t={t}
              language={i18n.language}
            />
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Wallet aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">{t('appraiser.performance.commissionsTitle')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('appraiser.performance.commissionsHint')}
                </p>
              </div>
            </div>
            <CommissionList userId={userId} t={t} language={i18n.language} />
          </section>
        </div>
      )}
    </AppraiserPageShell>
  )
}
