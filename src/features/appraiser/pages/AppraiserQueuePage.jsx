import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Clock3, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLocation } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import { AppraiserUnavailableState } from '@/features/appraiser/components/AppraiserUnavailableState'
import { useOpenAppraisalRequests } from '@/features/appraiser/hooks/useAppraiserData'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'
import { Button } from '@/components/ui/button'
import { useCurrentTime } from '@/features/appraiser/hooks/useCurrentTime'

export function AppraiserQueuePage() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const [page, setPage] = useState(1)
  const now = useCurrentTime()
  const isPreview = location.pathname.startsWith('/__preview/')
  const requestsQuery = useOpenAppraisalRequests(userId, page, !isPreview)

  return (
    <AppraiserPageShell
      title={t('appraiser.queue.title')}
      description={t('appraiser.queue.description')}
    >
      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t('appraiser.queue.sectionEyebrow')}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{t('appraiser.queue.listTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('appraiser.queue.listDescription')}
            </p>
          </div>
          {requestsQuery.isSuccess && (
            <p className="text-sm text-muted-foreground">
              {t('appraiser.queue.total', { count: requestsQuery.data.totalElements })}
            </p>
          )}
        </div>

        {isPreview ? (
          <AppraiserUnavailableState
            title={t('appraiser.queue.previewTitle')}
            description={t('appraiser.queue.previewDescription')}
          />
        ) : requestsQuery.isPending ? (
          <div role="status" className="grid gap-3" aria-label={t('appraiser.queue.loading')}>
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-xl border border-border bg-muted"
              />
            ))}
          </div>
        ) : requestsQuery.isError ? (
          requestsQuery.error?.status === 403 ? (
            <ForbiddenState />
          ) : (
            <ErrorState
              title={t('appraiser.queue.errorTitle')}
              description={t('appraiser.queue.errorDescription')}
              onRetry={() => void requestsQuery.refetch()}
              isRetrying={requestsQuery.isFetching}
            />
          )
        ) : requestsQuery.data.items.length === 0 ? (
          <EmptyState
            title={t('appraiser.queue.emptyTitle')}
            description={t('appraiser.queue.emptyDescription')}
          />
        ) : (
          <>
            <div className="grid gap-3">
              {requestsQuery.data.items.map((request) => {
                const deadlinePassed =
                  request.deadline && now > 0 && new Date(request.deadline).getTime() < now

                return (
                  <article
                    key={request.id}
                    className="rounded-xl border border-border bg-card p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <Tag aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <AppraiserStatusBadge domain="request" status={request.status} />
                          <span className="text-xs text-muted-foreground">
                            {t('appraiser.queue.reference', { id: request.id })}
                          </span>
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-lg font-semibold">
                          {request.description || t('appraiser.queue.untitledRequest')}
                        </h3>
                        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              {t('appraiser.queue.listingId')}
                            </dt>
                            <dd className="mt-0.5 break-all font-mono text-xs">
                              {request.listingId}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              {t('appraiser.queue.expectedPrice')}
                            </dt>
                            <dd className="mt-0.5 font-semibold tabular-nums">
                              {formatVnd(request.expectedPrice, i18n.language)}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="sr-only">{t('appraiser.queue.deadline')}</dt>
                            <dd
                              className={`inline-flex items-center gap-1.5 ${deadlinePassed ? 'text-destructive' : 'text-muted-foreground'}`}
                            >
                              <Clock3 aria-hidden="true" className="size-4" />
                              {deadlinePassed
                                ? t('appraiser.queue.deadlinePassed')
                                : t('appraiser.queue.deadlineAt', {
                                    date: formatLocalDate(request.deadline, i18n.language),
                                  })}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <Button asChild variant="outline" className="min-h-11 shrink-0">
                        <Link to={`/appraiser/requests/${encodeURIComponent(request.id)}`}>
                          {t('appraiser.queue.viewRequest')}
                          <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                      </Button>
                    </div>
                    {deadlinePassed && (
                      <p className="mt-4 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                        <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                        {t('appraiser.queue.deadlineExpiredHint')}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {t('appraiser.queue.page', {
                  page: requestsQuery.data.page,
                  totalPages: requestsQuery.data.totalPages,
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page <= 1 || requestsQuery.isFetching}
                  onClick={() => setPage((value) => Math.max(value - 1, 1))}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  {t('appraiser.pagination.previous')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!requestsQuery.data.hasNext || requestsQuery.isFetching}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t('appraiser.pagination.next')}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </AppraiserPageShell>
  )
}
