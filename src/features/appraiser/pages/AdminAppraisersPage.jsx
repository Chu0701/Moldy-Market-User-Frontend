import { useState } from 'react'
import { skipToken, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import {
  useAdminAppraiserAction,
  useAdminAppraiserList,
} from '@/features/appraiser/hooks/useAdminAppraisers'
import { getAdminAppraiserStatus } from '@/services/appraiser/appraiserService'

const statuses = ['', 'PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'REJECTED']

export function AdminAppraisersPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState('')
  const [error, setError] = useState('')
  const query = useAdminAppraiserList(status, page)
  const action = useAdminAppraiserAction()
  const statusDetail = useQuery({
    queryKey: ['adminAppraiserStatus', expandedId],
    queryFn: expandedId
      ? ({ signal }) => getAdminAppraiserStatus({ appraiserId: expandedId, signal })
      : skipToken,
    retry: false,
  })
  async function run(actionName, appraiserId) {
    setError('')
    let params = { action: actionName, appraiserId }
    if (actionName === 'reject') {
      const rejectionReason = window.prompt(t('adminAppraisers.rejectPrompt'))
      if (!rejectionReason?.trim()) return
      params.rejectionReason = rejectionReason.trim()
    }
    if (actionName === 'suspend') {
      const reason = window.prompt(t('adminAppraisers.suspendPrompt'))
      if (!reason?.trim()) return
      params.reason = reason.trim()
      params.suspensionUntil = null
    }
    try {
      await action.mutateAsync(params)
    } catch {
      setError(t('adminAppraisers.actionError'))
    }
  }
  if (query.isError && query.error?.status === 403) return <ForbiddenState />
  return (
    <main className="space-y-6">
      <header>
        <h1>{t('adminAppraisers.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('adminAppraisers.description')}</p>
      </header>
      <label className="grid max-w-sm gap-2 text-sm">
        {t('adminAppraisers.filter')}
        <select
          value={status}
          onChange={(event) => {
            setPage(1)
            setStatus(event.target.value)
          }}
          className="min-h-11 rounded-lg border border-input bg-background px-3"
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item ? t(`appraiser.status.appraiser.${item}`) : t('adminAppraisers.all')}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-destructive">
          {error}
        </p>
      )}
      {query.isPending ? (
        <p role="status">{t('adminAppraisers.loading')}</p>
      ) : query.isError ? (
        <ErrorState
          title={t('adminAppraisers.errorTitle')}
          description={t('adminAppraisers.errorDescription')}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title={t('adminAppraisers.emptyTitle')}
          description={t('adminAppraisers.emptyDescription')}
        />
      ) : (
        <div className="space-y-3">
          {query.data.items.map((appraiser) => (
            <article key={appraiser.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <AppraiserStatusBadge domain="appraiser" status={appraiser.status} />
                    <AppraiserStatusBadge
                      domain="verification"
                      status={appraiser.verificationLevel}
                    />
                  </div>
                  <h2 className="mt-3 font-semibold">{appraiser.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{appraiser.email}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{appraiser.bio}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {appraiser.categories?.map((category) => category.categoryName).join(' · ')}
                  </p>
                  <Button
                    variant="link"
                    className="mt-2 h-auto p-0"
                    onClick={() =>
                      setExpandedId((current) => (current === appraiser.id ? '' : appraiser.id))
                    }
                  >
                    {expandedId === appraiser.id
                      ? t('adminAppraisers.hideDetails')
                      : t('adminAppraisers.details')}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appraiser.status === 'PENDING' && (
                    <>
                      <Button
                        disabled={action.isPending}
                        onClick={() => void run('approve', appraiser.id)}
                      >
                        {t('adminAppraisers.approve')}
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={action.isPending}
                        onClick={() => void run('reject', appraiser.id)}
                      >
                        {t('adminAppraisers.reject')}
                      </Button>
                    </>
                  )}
                  {appraiser.status === 'ACTIVE' && (
                    <Button
                      variant="outline"
                      disabled={action.isPending}
                      onClick={() => void run('suspend', appraiser.id)}
                    >
                      {t('adminAppraisers.suspend')}
                    </Button>
                  )}
                  {appraiser.status === 'SUSPENDED' && (
                    <Button
                      disabled={action.isPending}
                      onClick={() => void run('resume', appraiser.id)}
                    >
                      {t('adminAppraisers.resume')}
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
          {expandedId && statusDetail.isPending && (
            <p role="status">{t('adminAppraisers.loadingStatus')}</p>
          )}
          {expandedId && statusDetail.data && (
            <section
              className="rounded-xl border border-border bg-card p-5"
              aria-label={t('adminAppraisers.details')}
            >
              <h2 className="font-semibold">{t('adminAppraisers.statusDetails')}</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('adminAppraisers.rejectionReason')}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm">
                    {statusDetail.data.rejectionReason || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('adminAppraisers.suspensionReason')}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm">
                    {statusDetail.data.suspensionReason || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('adminAppraisers.suspensionUntil')}
                  </dt>
                  <dd className="mt-1 text-sm">
                    {statusDetail.data.suspensionUntil || t('adminAppraisers.noExpiry')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('adminAppraisers.updatedAt')}
                  </dt>
                  <dd className="mt-1 text-sm">{statusDetail.data.updatedAt || '—'}</dd>
                </div>
              </dl>
            </section>
          )}
          {expandedId && statusDetail.isError && (
            <ErrorState
              title={t('adminAppraisers.statusErrorTitle')}
              description={t('adminAppraisers.errorDescription')}
              onRetry={() => void statusDetail.refetch()}
              isRetrying={statusDetail.isFetching}
            />
          )}
          {query.data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                {t('appraiser.pagination.previous')}
              </Button>
              <span>
                {page}/{query.data.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={!query.data.hasNext || query.isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                {t('appraiser.pagination.next')}
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
