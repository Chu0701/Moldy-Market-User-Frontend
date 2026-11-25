import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import {
  useCancelSellerRequest,
  useCreateSellerRequest,
  useSellerAssignments,
  useSellerRequests,
} from '@/features/appraiser/hooks/useSellerAppraisals'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'
import { useCurrentTime } from '@/features/appraiser/hooks/useCurrentTime'

export function SellerAppraisalsPage() {
  const { t, i18n } = useTranslation()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const [page, setPage] = useState(1)
  const [assignmentPage, setAssignmentPage] = useState(1)
  const now = useCurrentTime()
  const query = useSellerRequests(userId, page)
  const assignments = useSellerAssignments(userId, assignmentPage)
  const create = useCreateSellerRequest(userId)
  const cancel = useCancelSellerRequest(userId)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    setError('')
    setNotice('')
    const data = new FormData(event.currentTarget)
    const deadline = new Date(String(data.get('deadline')))
    if (!Number.isFinite(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      setError(t('sellerAppraisals.deadlineError'))
      return
    }
    const payload = {
      listingId: String(data.get('listingId')).trim(),
      description: String(data.get('description')).trim(),
      expectedPrice: Number(data.get('expectedPrice')),
      deadline: deadline.toISOString(),
    }
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        payload.listingId,
      )
    ) {
      setError(t('sellerAppraisals.listingIdError'))
      return
    }
    try {
      await create.mutateAsync(payload)
      form.reset()
      setNotice(t('sellerAppraisals.created'))
    } catch {
      setError(t('sellerAppraisals.saveError'))
    }
  }

  async function cancelRequest(requestId) {
    try {
      await cancel.mutateAsync({ requestId })
      setNotice(t('sellerAppraisals.cancelled'))
    } catch {
      setError(t('sellerAppraisals.saveError'))
    }
  }

  return (
    <main className="space-y-7">
      <header>
        <h1>{t('sellerAppraisals.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('sellerAppraisals.description')}</p>
      </header>
      {notice && (
        <p role="status" className="rounded-lg bg-success/10 p-3 text-success">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-destructive">
          {error}
        </p>
      )}
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">{t('sellerAppraisals.createTitle')}</h2>
        <label className="grid gap-2 text-sm">
          {t('sellerAppraisals.listingId')}
          <input
            name="listingId"
            required
            type="text"
            className="min-h-11 rounded-lg border border-input bg-background px-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          {t('sellerAppraisals.expectedPrice')}
          <input
            name="expectedPrice"
            required
            min="0.01"
            step="0.01"
            type="number"
            className="min-h-11 rounded-lg border border-input bg-background px-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          {t('sellerAppraisals.deadline')}
          <input
            name="deadline"
            required
            type="datetime-local"
            min={now ? new Date(now + 60000).toISOString().slice(0, 16) : undefined}
            className="min-h-11 rounded-lg border border-input bg-background px-3"
          />
        </label>
        <label className="grid gap-2 text-sm sm:col-span-2">
          {t('sellerAppraisals.requestDescription')}
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={5000}
            rows={4}
            className="rounded-lg border border-input bg-background p-3"
          />
        </label>
        <Button
          disabled={create.isPending}
          className="min-h-11 sm:col-span-2 sm:justify-self-start"
        >
          {create.isPending ? t('sellerAppraisals.saving') : t('sellerAppraisals.create')}
        </Button>
      </form>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('sellerAppraisals.myRequests')}</h2>
        {query.isPending ? (
          <p role="status" className="rounded-xl border border-border p-5">
            {t('sellerAppraisals.loading')}
          </p>
        ) : query.isError ? (
          <ErrorState
            title={t('sellerAppraisals.loadError')}
            description={t('sellerAppraisals.loadErrorDescription')}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : !query.data.items.length ? (
          <EmptyState
            title={t('sellerAppraisals.emptyTitle')}
            description={t('sellerAppraisals.emptyDescription')}
          />
        ) : (
          <div className="space-y-3">
            {query.data.items.map((request) => (
              <article
                key={request.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <AppraiserStatusBadge domain="request" status={request.status} />
                    <span className="text-xs text-muted-foreground">{request.id}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{request.description}</p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatVnd(request.expectedPrice, i18n.language)} ·{' '}
                    {formatLocalDate(request.deadline, i18n.language)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/appraisals/requests/${encodeURIComponent(request.id)}`}>
                      {t('sellerAppraisals.view')}
                    </Link>
                  </Button>
                  {request.status === 'OPEN' && (
                    <Button
                      variant="destructive"
                      disabled={cancel.isPending}
                      onClick={() => void cancelRequest(request.id)}
                    >
                      {t('sellerAppraisals.cancel')}
                    </Button>
                  )}
                </div>
              </article>
            ))}
            {query.data.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => setPage((value) => value - 1)}
                >
                  {t('appraiser.pagination.previous')}
                </Button>
                <span className="text-sm">
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
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('sellerAppraisals.assignments')}</h2>
        {assignments.isPending ? (
          <p role="status">{t('sellerAppraisals.loading')}</p>
        ) : assignments.isError ? (
          <ErrorState
            title={t('sellerAppraisals.loadError')}
            description={t('sellerAppraisals.loadErrorDescription')}
            onRetry={() => void assignments.refetch()}
            isRetrying={assignments.isFetching}
          />
        ) : assignments.data.items.length === 0 ? (
          <EmptyState
            title={t('sellerAppraisals.noAssignments')}
            description={t('sellerAppraisals.noAssignmentsDescription')}
          />
        ) : (
          assignments.data.items.map((assignment) => (
            <article
              key={assignment.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2">
                <AppraiserStatusBadge domain="assignment" status={assignment.status} />
                <Link
                  to={`/appraisers/${encodeURIComponent(assignment.appraiserId)}`}
                  className="text-sm underline underline-offset-4"
                >
                  {assignment.appraiserName ?? assignment.appraiserId}
                </Link>
                <span className="text-sm font-semibold">
                  {formatVnd(assignment.agreedFee, i18n.language)}
                </span>
              </div>
              <Button asChild variant="outline">
                <Link to={`/appraisals/assignments/${encodeURIComponent(assignment.id)}`}>
                  {t('sellerAppraisals.view')}
                </Link>
              </Button>
            </article>
          ))
        )}
        {!assignments.isPending && !assignments.isError && assignments.data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={assignmentPage <= 1 || assignments.isFetching}
              onClick={() => setAssignmentPage((value) => value - 1)}
            >
              {t('appraiser.pagination.previous')}
            </Button>
            <span className="text-sm">
              {assignmentPage}/{assignments.data.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!assignments.data.hasNext || assignments.isFetching}
              onClick={() => setAssignmentPage((value) => value + 1)}
            >
              {t('appraiser.pagination.next')}
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
