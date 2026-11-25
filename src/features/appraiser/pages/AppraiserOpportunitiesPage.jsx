import { useState } from 'react'
import { ArrowLeft, ArrowRight, Clock3, Inbox, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import { ConfirmActionButton } from '@/features/appraiser/components/ConfirmActionButton'
import {
  useAcceptAppraisalInvitation,
  useMyAppraisalApplications,
  useMyAppraisalInvitations,
  useMyAppraiserProfile,
  useRejectAppraisalInvitation,
  useWithdrawAppraisalApplication,
} from '@/features/appraiser/hooks/useAppraiserData'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'
import { useCurrentTime } from '@/features/appraiser/hooks/useCurrentTime'

function PageControls({ page, data, isFetching, onPageChange, t }) {
  if (!data || data.totalPages <= 1) return null
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {t('appraiser.queue.page', { page: data.page, totalPages: data.totalPages })}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t('appraiser.pagination.previous')}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!data.hasNext || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          {t('appraiser.pagination.next')}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function AppraiserOpportunitiesPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTab = searchParams.get('tab') === 'applications' ? 'applications' : 'invitations'
  const { profileQuery: sessionQuery } = useSession()
  const userId = sessionQuery.data?.id
  const [page, setPage] = useState(1)
  const now = useCurrentTime()
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const profileQuery = useMyAppraiserProfile(userId)
  const invitationsQuery = useMyAppraisalInvitations(userId, page)
  const applicationsQuery = useMyAppraisalApplications(userId, page)
  const acceptMutation = useAcceptAppraisalInvitation(userId)
  const rejectMutation = useRejectAppraisalInvitation(userId)
  const withdrawMutation = useWithdrawAppraisalApplication(userId)
  const query = selectedTab === 'invitations' ? invitationsQuery : applicationsQuery

  async function respondToInvitation(invitationId, action) {
    setActionError('')
    setMessage('')
    try {
      await (action === 'accept' ? acceptMutation : rejectMutation).mutateAsync({ invitationId })
      setMessage(
        action === 'accept'
          ? 'appraiser.messages.invitationAccepted'
          : 'appraiser.messages.invitationRejected',
      )
    } catch {
      setActionError('appraiser.errors.submitFailed')
      void invitationsQuery.refetch()
    }
  }

  async function withdrawApplication(applicationId) {
    setActionError('')
    setMessage('')
    try {
      await withdrawMutation.mutateAsync({ applicationId })
      setMessage('appraiser.messages.applicationWithdrawn')
    } catch {
      setActionError('appraiser.errors.submitFailed')
      void applicationsQuery.refetch()
    }
  }

  function chooseTab(tab) {
    setPage(1)
    setMessage('')
    setActionError('')
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <AppraiserPageShell
      title={t('appraiser.opportunities.title')}
      description={t('appraiser.opportunities.description')}
    >
      <div className="space-y-5">
        <div
          role="tablist"
          aria-label={t('appraiser.opportunities.tabsLabel')}
          className="flex gap-1 border-b border-border"
        >
          {[
            { id: 'invitations', label: 'appraiser.opportunities.invitations', icon: Inbox },
            { id: 'applications', label: 'appraiser.opportunities.applications', icon: Send },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selectedTab === id}
              onClick={() => chooseTab(id)}
              className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedTab === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {t(label)}
            </button>
          ))}
        </div>

        {message && (
          <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            {t(message)}
          </p>
        )}
        {actionError && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {t(actionError)}
          </p>
        )}

        {query.isPending ? (
          <p
            role="status"
            className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground"
          >
            {t('appraiser.opportunities.loading')}
          </p>
        ) : query.isError ? (
          query.error?.status === 403 ? (
            <ForbiddenState />
          ) : (
            <ErrorState
              title={t('appraiser.opportunities.errorTitle')}
              description={t('appraiser.opportunities.errorDescription')}
              onRetry={() => void query.refetch()}
              isRetrying={query.isFetching}
            />
          )
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title={t(`appraiser.opportunities.${selectedTab}EmptyTitle`)}
            description={t(`appraiser.opportunities.${selectedTab}EmptyDescription`)}
          />
        ) : (
          <div className="space-y-3">
            {query.data.items.map((item) => {
              if (selectedTab === 'invitations') {
                const invitation = item
                const isPending = invitation.status === 'PENDING'
                const expired =
                  invitation.deadline && now > 0 && new Date(invitation.deadline).getTime() <= now
                const canRespond = isPending && !expired && profileQuery.data?.status === 'ACTIVE'
                return (
                  <article
                    key={invitation.id}
                    className="rounded-xl border border-border bg-card p-5 sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <AppraiserStatusBadge domain="invitation" status={invitation.status} />
                          <span className="text-xs text-muted-foreground">
                            {t('appraiser.opportunities.requestId', {
                              id: invitation.appraisalRequestId,
                            })}
                          </span>
                        </div>
                        <p className="mt-3 text-lg font-semibold tabular-nums">
                          {formatVnd(invitation.proposedFee, i18n.language)}
                        </p>
                        {invitation.message && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                            {invitation.message}
                          </p>
                        )}
                        <p
                          className={`mt-3 inline-flex items-center gap-1.5 text-xs ${expired ? 'text-destructive' : 'text-muted-foreground'}`}
                        >
                          <Clock3 aria-hidden="true" className="size-3.5" />
                          {expired
                            ? t('appraiser.opportunities.invitationExpired')
                            : t('appraiser.opportunities.deadline', {
                                date: formatLocalDate(invitation.deadline, i18n.language),
                              })}
                        </p>
                      </div>
                      {isPending && (
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <ConfirmActionButton
                            label={t('appraiser.opportunities.reject')}
                            title={t('appraiser.opportunities.rejectTitle')}
                            description={t('appraiser.opportunities.rejectDescription')}
                            confirmLabel={t('appraiser.opportunities.reject')}
                            disabled={
                              !canRespond || rejectMutation.isPending || acceptMutation.isPending
                            }
                            onConfirm={() => respondToInvitation(invitation.id, 'reject')}
                          />
                          <ConfirmActionButton
                            label={t('appraiser.opportunities.accept')}
                            title={t('appraiser.opportunities.acceptTitle')}
                            description={t('appraiser.opportunities.acceptDescription')}
                            confirmLabel={t('appraiser.opportunities.accept')}
                            disabled={
                              !canRespond || acceptMutation.isPending || rejectMutation.isPending
                            }
                            onConfirm={() => respondToInvitation(invitation.id, 'accept')}
                          />
                        </div>
                      )}
                    </div>
                    {!canRespond && isPending && !expired && (
                      <p className="mt-4 text-xs text-muted-foreground">
                        {profileQuery.data?.status
                          ? t('appraiser.opportunities.activeProfileRequired')
                          : t('appraiser.opportunities.profileLoading')}{' '}
                        <Link to="/appraiser/profile" className="underline underline-offset-4">
                          {t('appraiser.opportunities.profileLink')}
                        </Link>
                      </p>
                    )}
                  </article>
                )
              }

              const application = item
              const canWithdraw = application.status === 'PENDING'
              return (
                <article
                  key={application.id}
                  className="rounded-xl border border-border bg-card p-5 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <AppraiserStatusBadge domain="application" status={application.status} />
                        <span className="text-xs text-muted-foreground">
                          {t('appraiser.opportunities.requestId', {
                            id: application.appraisalRequestId,
                          })}
                        </span>
                      </div>
                      <p className="mt-3 text-lg font-semibold tabular-nums">
                        {formatVnd(application.proposedFee, i18n.language)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                        {application.introduction}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t('appraiser.opportunities.appliedAt', {
                          date: formatLocalDate(application.appliedAt, i18n.language),
                        })}
                      </p>
                    </div>
                    {canWithdraw && (
                      <ConfirmActionButton
                        label={t('appraiser.opportunities.withdraw')}
                        title={t('appraiser.opportunities.withdrawTitle')}
                        description={t('appraiser.opportunities.withdrawDescription')}
                        confirmLabel={t('appraiser.opportunities.withdraw')}
                        disabled={withdrawMutation.isPending}
                        onConfirm={() => withdrawApplication(application.id)}
                      />
                    )}
                  </div>
                </article>
              )
            })}
            <PageControls
              page={page}
              data={query.data}
              isFetching={query.isFetching}
              onPageChange={setPage}
              t={t}
            />
          </div>
        )}
      </div>
    </AppraiserPageShell>
  )
}
