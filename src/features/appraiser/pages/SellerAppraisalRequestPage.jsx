import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import {
  useRequestApplications,
  useRequestInvitations,
  useSelectRequestAppraiser,
  useCreateSellerInvitation,
  useCancelSellerInvitation,
  useOwnedAppraisalRequest,
} from '@/features/appraiser/hooks/useSellerAppraisals'
import { useSession } from '@/features/auth/hooks/useSession'
import { getActiveAppraisers } from '@/services/appraiser/appraiserService'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'

export function SellerAppraisalRequestPage() {
  const { t, i18n } = useTranslation()
  const { requestId } = useParams()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const request = useOwnedAppraisalRequest(userId, requestId)
  const applications = useRequestApplications(userId, requestId, applicationPage)
  const invitations = useRequestInvitations(userId, requestId, invitationPage)
  const experts = useQuery({
    queryKey: ['sellerAppraisals', userId, 'activeAppraisers', 1],
    queryFn: ({ signal }) => getActiveAppraisers({ page: 1, size: 100, signal }),
    enabled: Boolean(userId),
    retry: false,
  })
  const select = useSelectRequestAppraiser(userId)
  const invite = useCreateSellerInvitation(userId)
  const cancelInvite = useCancelSellerInvitation(userId)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [applicationPage, setApplicationPage] = useState(1)
  const [invitationPage, setInvitationPage] = useState(1)

  async function selectApplication(applicationId) {
    setError('')
    setMessage('')
    try {
      await select.mutateAsync({ requestId, applicationId })
      setMessage(t('sellerAppraisals.assignmentCreated'))
    } catch {
      setError(t('sellerAppraisals.saveError'))
      void request.refetch()
      void applications.refetch()
    }
  }

  async function inviteAppraiser(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setError('')
    setMessage('')
    const deadline = new Date(String(data.get('deadline')))
    if (!Number.isFinite(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      setError(t('sellerAppraisals.deadlineError'))
      return
    }
    try {
      await invite.mutateAsync({
        requestId,
        payload: {
          appraiserId: data.get('appraiserId'),
          proposedFee: Number(data.get('proposedFee')),
          message: String(data.get('message')).trim(),
          deadline: deadline.toISOString(),
        },
      })
      form.reset()
      setMessage(t('sellerAppraisals.invitationSent'))
    } catch {
      setError(t('sellerAppraisals.saveError'))
    }
  }
  async function cancelInvitation(invitationId) {
    setError('')
    setMessage('')
    try {
      await cancelInvite.mutateAsync({ invitationId })
      setMessage(t('sellerAppraisals.invitationCancelled'))
      void invitations.refetch()
    } catch {
      setError(t('sellerAppraisals.saveError'))
      void invitations.refetch()
    }
  }

  if (request.isPending) return <p role="status">{t('sellerAppraisals.loading')}</p>
  if (request.isError)
    return (
      <ErrorState
        title={t('sellerAppraisals.loadError')}
        description={t('sellerAppraisals.loadErrorDescription')}
        onRetry={() => void request.refetch()}
        isRetrying={request.isFetching}
      />
    )
  if (!request.data)
    return (
      <EmptyState
        title={t('sellerAppraisals.requestUnavailable')}
        description={t('sellerAppraisals.requestUnavailableDescription')}
      />
    )
  const item = request.data

  return (
    <main className="space-y-6">
      <header>
        <h1>{t('sellerAppraisals.requestDetail')}</h1>
        <p className="mt-2 text-muted-foreground">{item.id}</p>
      </header>
      {message && (
        <p role="status" className="rounded-lg bg-success/10 p-3 text-success">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-destructive">
          {error}
        </p>
      )}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <AppraiserStatusBadge domain="request" status={item.status} />
          <span>{formatLocalDate(item.deadline, i18n.language)}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap">{item.description}</p>
        <p className="mt-3 font-semibold">{formatVnd(item.expectedPrice, i18n.language)}</p>
      </section>
      {item.status === 'OPEN' && (
        <form
          onSubmit={inviteAppraiser}
          className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
        >
          <h2 className="text-lg font-semibold sm:col-span-2">
            {t('sellerAppraisals.inviteTitle')}
          </h2>
          <label className="grid gap-2 text-sm">
            {t('sellerAppraisals.appraiser')}
            <select
              name="appraiserId"
              required
              className="min-h-11 rounded-lg border border-input bg-background px-3"
              disabled={experts.isPending || experts.isError}
            >
              <option value="">{t('sellerAppraisals.chooseAppraiser')}</option>
              {experts.data?.items.map((expert) => (
                <option key={expert.id} value={expert.id}>
                  {expert.fullName} · {expert.averageRating ?? '—'} ★
                </option>
              ))}
            </select>
            {experts.isError && (
              <span role="alert" className="text-destructive">
                {t('sellerAppraisals.expertsError')}
              </span>
            )}
          </label>
          <label className="grid gap-2 text-sm">
            {t('sellerAppraisals.proposedFee')}
            <input
              required
              name="proposedFee"
              type="number"
              min="0.01"
              step="0.01"
              className="min-h-11 rounded-lg border border-input bg-background px-3"
            />
          </label>
          <label className="grid gap-2 text-sm">
            {t('sellerAppraisals.invitationDeadline')}
            <input
              required
              name="deadline"
              type="datetime-local"
              className="min-h-11 rounded-lg border border-input bg-background px-3"
            />
          </label>
          <label className="grid gap-2 text-sm sm:col-span-2">
            {t('sellerAppraisals.message')}
            <textarea
              required
              name="message"
              minLength="10"
              maxLength="2000"
              rows="3"
              className="rounded-lg border border-input bg-background p-3"
            />
          </label>
          <Button
            disabled={invite.isPending || experts.isPending || !experts.data?.items.length}
            className="sm:justify-self-start"
          >
            {t('sellerAppraisals.sendInvitation')}
          </Button>
        </form>
      )}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('sellerAppraisals.applications')}</h2>
        {applications.isPending ? (
          <p role="status">{t('sellerAppraisals.loading')}</p>
        ) : applications.isError ? (
          <ErrorState
            title={t('sellerAppraisals.loadError')}
            description={t('sellerAppraisals.loadErrorDescription')}
            onRetry={() => void applications.refetch()}
            isRetrying={applications.isFetching}
          />
        ) : !applications.data.items.length ? (
          <EmptyState
            title={t('sellerAppraisals.noApplications')}
            description={t('sellerAppraisals.noApplicationsDescription')}
          />
        ) : (
          applications.data.items.map((application) => (
            <article
              key={application.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <AppraiserStatusBadge domain="application" status={application.status} />
                  <Link
                    to={`/appraisers/${encodeURIComponent(application.appraiserId)}`}
                    className="text-sm underline underline-offset-4"
                  >
                    {application.appraiserName ?? application.appraiserId}
                  </Link>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{application.introduction}</p>
                <p className="mt-2 text-sm font-semibold">
                  {formatVnd(application.proposedFee, i18n.language)} ·{' '}
                  {application.estimatedCompletionHours}h
                </p>
              </div>
              {item.status === 'OPEN' && application.status === 'PENDING' && (
                <Button
                  disabled={select.isPending}
                  onClick={() => void selectApplication(application.id)}
                >
                  {t('sellerAppraisals.select')}
                </Button>
              )}
            </article>
          ))
        )}
        {!applications.isPending && !applications.isError && applications.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              variant="outline"
              disabled={applicationPage <= 1 || applications.isFetching}
              onClick={() => setApplicationPage((value) => value - 1)}
            >
              {t('appraiser.pagination.previous')}
            </Button>
            <span className="text-sm">
              {applicationPage}/{applications.data.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!applications.data.hasNext || applications.isFetching}
              onClick={() => setApplicationPage((value) => value + 1)}
            >
              {t('appraiser.pagination.next')}
            </Button>
          </div>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('sellerAppraisals.invitations')}</h2>
        {invitations.isPending ? (
          <p role="status">{t('sellerAppraisals.loading')}</p>
        ) : invitations.isError ? (
          <ErrorState
            title={t('sellerAppraisals.loadError')}
            description={t('sellerAppraisals.loadErrorDescription')}
            onRetry={() => void invitations.refetch()}
            isRetrying={invitations.isFetching}
          />
        ) : invitations.data.items.length === 0 ? (
          <EmptyState
            title={t('sellerAppraisals.noInvitations')}
            description={t('sellerAppraisals.noInvitationsDescription')}
          />
        ) : (
          invitations.data.items.map((row) => (
            <article
              key={row.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <AppraiserStatusBadge domain="invitation" status={row.status} />
                <p className="mt-2 text-sm">
                  <Link
                    to={`/appraisers/${encodeURIComponent(row.appraiserId)}`}
                    className="underline underline-offset-4"
                  >
                    {row.appraiserName ?? row.appraiserId}
                  </Link>{' '}
                  · {formatVnd(row.proposedFee, i18n.language)}
                </p>
              </div>
              {row.status === 'PENDING' && (
                <Button
                  variant="outline"
                  disabled={cancelInvite.isPending}
                  onClick={() => void cancelInvitation(row.id)}
                >
                  {t('sellerAppraisals.cancel')}
                </Button>
              )}
            </article>
          ))
        )}
        {!invitations.isPending && !invitations.isError && invitations.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              variant="outline"
              disabled={invitationPage <= 1 || invitations.isFetching}
              onClick={() => setInvitationPage((value) => value - 1)}
            >
              {t('appraiser.pagination.previous')}
            </Button>
            <span className="text-sm">
              {invitationPage}/{invitations.data.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!invitations.data.hasNext || invitations.isFetching}
              onClick={() => setInvitationPage((value) => value + 1)}
            >
              {t('appraiser.pagination.next')}
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}
