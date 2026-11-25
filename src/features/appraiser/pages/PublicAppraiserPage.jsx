import { useState } from 'react'
import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { getPublicAppraiserProfile } from '@/services/appraiser/appraiserService'
import { getAppraiserReviews } from '@/services/appraisal/appraisalService'
import { formatLocalDate } from '@/features/appraiser/utils/formatters'

export function PublicAppraiserPage() {
  const { t, i18n } = useTranslation()
  const { appraiserId } = useParams()
  const { profileQuery } = useSession()
  const [page, setPage] = useState(1)
  const profile = useQuery({
    queryKey: ['publicAppraiser', appraiserId],
    queryFn: ({ signal }) => getPublicAppraiserProfile({ appraiserId, signal }),
    enabled: Boolean(profileQuery.data?.id && appraiserId),
    retry: false,
  })
  const reviews = useQuery({
    queryKey: ['appraiserReviews', appraiserId, page],
    queryFn: ({ signal }) => getAppraiserReviews({ appraiserId, page, signal }),
    enabled: Boolean(profileQuery.data?.id && appraiserId),
    retry: false,
  })
  return (
    <main className="space-y-6">
      <header>
        <h1>{t('appraiserDirectory.profileTitle')}</h1>
      </header>
      {profile.isPending ? (
        <p role="status">{t('appraiserDirectory.loading')}</p>
      ) : profile.isError ? (
        <ErrorState
          title={t('appraiserDirectory.errorTitle')}
          description={t('appraiserDirectory.errorDescription')}
          onRetry={() => void profile.refetch()}
          isRetrying={profile.isFetching}
        />
      ) : (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <AppraiserStatusBadge domain="appraiser" status={profile.data.status} />
            <AppraiserStatusBadge domain="verification" status={profile.data.verificationLevel} />
          </div>
          <div className="mt-4 flex items-start gap-4">
            {profile.data.avatarUrl && (
              <img
                src={profile.data.avatarUrl}
                alt=""
                className="size-16 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-2xl font-semibold">{profile.data.fullName}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{profile.data.bio}</p>
            </div>
          </div>
          <p className="mt-4 text-sm">
            {profile.data.categories?.map((category) => category.categoryName).join(' · ')}
          </p>
          <p className="mt-2 text-sm">
            ★ {profile.data.averageRating ?? '—'} ({profile.data.reviewCount ?? 0}) ·{' '}
            {t('appraiserDirectory.completed', {
              count: profile.data.totalCompletedAppraisals ?? 0,
            })}
          </p>
        </section>
      )}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('appraiserDirectory.reviews')}</h2>
        {reviews.isPending ? (
          <p role="status">{t('appraiserDirectory.loading')}</p>
        ) : reviews.isError ? (
          <ErrorState
            title={t('appraiserDirectory.reviewsError')}
            description={t('appraiserDirectory.errorDescription')}
            onRetry={() => void reviews.refetch()}
            isRetrying={reviews.isFetching}
          />
        ) : reviews.data.items.length === 0 ? (
          <EmptyState
            title={t('appraiserDirectory.noReviews')}
            description={t('appraiserDirectory.noReviewsDescription')}
          />
        ) : (
          reviews.data.items.map((review) => (
            <article key={review.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between gap-3">
                <strong>★ {review.rating}/5</strong>
                <time className="text-xs text-muted-foreground">
                  {formatLocalDate(review.createdAt, i18n.language)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{review.comment || '—'}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t('appraiserDirectory.reviewMetrics', {
                  accuracy: review.accuracy,
                  professionalism: review.professionalism,
                  communication: review.communication,
                  timeliness: review.timeliness,
                })}
              </p>
            </article>
          ))
        )}
        {reviews.data?.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={page <= 1 || reviews.isFetching}
              onClick={() => setPage((value) => value - 1)}
            >
              {t('appraiser.pagination.previous')}
            </Button>
            <span>
              {page}/{reviews.data.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!reviews.data.hasNext || reviews.isFetching}
              onClick={() => setPage((value) => value + 1)}
            >
              {t('appraiser.pagination.next')}
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
