import { useState } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { useAppraisalAssignment } from '@/features/appraiser/hooks/useAppraiserData'
import {
  useAcceptSellerReport,
  useCreateSellerReview,
  useRejectSellerReport,
  useSellerAssignmentReview,
  useSellerReportHistory,
} from '@/features/appraiser/hooks/useSellerAppraisals'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'

export function SellerAppraisalAssignmentPage() {
  const { t, i18n } = useTranslation()
  const { assignmentId } = useParams()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const assignment = useAppraisalAssignment(userId, assignmentId)
  const reports = useSellerReportHistory(userId, assignmentId)
  const review = useSellerAssignmentReview(userId, assignmentId)
  const accept = useAcceptSellerReport(userId)
  const reject = useRejectSellerReport(userId)
  const createReview = useCreateSellerReview(userId)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function reportAction(reportId, action, rejectionReason) {
    setError('')
    setNotice('')
    try {
      if (action === 'accept') await accept.mutateAsync({ reportId })
      else await reject.mutateAsync({ reportId, rejectionReason })
      setNotice(
        action === 'accept' ? t('sellerAppraisals.accepted') : t('sellerAppraisals.rejected'),
      )
      void reports.refetch()
      void assignment.refetch()
    } catch {
      setError(t('sellerAppraisals.saveError'))
      void reports.refetch()
      void assignment.refetch()
    }
  }

  async function submitReview(event) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      rating: Number(data.get('rating')),
      accuracy: Number(data.get('accuracy')),
      professionalism: Number(data.get('professionalism')),
      communication: Number(data.get('communication')),
      timeliness: Number(data.get('timeliness')),
      recommend: data.get('recommend') === 'on',
      comment: String(data.get('comment') ?? '').trim() || null,
    }
    try {
      await createReview.mutateAsync({ assignmentId, payload })
      setNotice(t('sellerAppraisals.reviewSaved'))
      void review.refetch()
      form.reset()
    } catch {
      setError(t('sellerAppraisals.saveError'))
      void review.refetch()
    }
  }

  if (assignment.isPending) return <p role="status">{t('sellerAppraisals.loading')}</p>
  if (assignment.isError)
    return assignment.error?.status === 403 ? (
      <ForbiddenState />
    ) : (
      <ErrorState
        title={t('sellerAppraisals.loadError')}
        description={t('sellerAppraisals.loadErrorDescription')}
        onRetry={() => void assignment.refetch()}
        isRetrying={assignment.isFetching}
      />
    )
  const submitted = reports.data?.find((item) => item.status === 'SUBMITTED')
  const rejectionCount = reports.data?.filter((item) => item.status === 'REJECTED').length ?? 0
  const noExistingReview =
    (review.isSuccess && !review.data) || (review.isError && review.error?.status === 404)
  const canReview =
    assignment.data.status === 'COMPLETED' &&
    reports.data?.some((item) => item.status === 'ACCEPTED') &&
    noExistingReview
  return (
    <main className="space-y-6">
      <header>
        <h1>{t('sellerAppraisals.assignments')}</h1>
        <p className="mt-2 text-muted-foreground">{assignmentId}</p>
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
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <AppraiserStatusBadge domain="assignment" status={assignment.data.status} />
          <span className="text-sm">
            {assignment.data.appraiserName ?? assignment.data.appraiserId}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">{t('sellerAppraisals.agreedFee')}</dt>
            <dd className="mt-1 font-semibold">
              {formatVnd(assignment.data.agreedFee, i18n.language)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t('sellerAppraisals.assignedAt')}</dt>
            <dd className="mt-1">{formatLocalDate(assignment.data.assignedAt, i18n.language)}</dd>
          </div>
        </dl>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t('sellerAppraisals.reports')} ·{' '}
          {t('sellerAppraisals.rejectionCount', { count: rejectionCount })}
        </h2>
        {reports.isPending ? (
          <p role="status">{t('sellerAppraisals.loading')}</p>
        ) : reports.isError ? (
          <ErrorState
            title={t('sellerAppraisals.loadError')}
            description={t('sellerAppraisals.loadErrorDescription')}
            onRetry={() => void reports.refetch()}
            isRetrying={reports.isFetching}
          />
        ) : reports.data.length === 0 ? (
          <EmptyState
            title={t('sellerAppraisals.noReport')}
            description={t('sellerAppraisals.noReportDescription')}
          />
        ) : (
          reports.data.map((report) => (
            <article
              key={report.id}
              className="space-y-3 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <AppraiserStatusBadge domain="report" status={report.status} />
                <span className="text-xs text-muted-foreground">
                  {t('appraiser.assignmentDetail.revision', { number: report.revisionNumber })}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatLocalDate(report.submittedAt, i18n.language)}
                </span>
              </div>
              <p className="font-semibold">{formatVnd(report.assessedValue, i18n.language)}</p>
              <p className="whitespace-pre-wrap text-sm leading-6">{report.description}</p>
              <div>
                <h3 className="text-sm font-medium">
                  {t('appraiser.assignmentDetail.conditionAssessment')}
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-sm">{report.conditionAssessment}</p>
              </div>
              {report.rejectionReason && (
                <p className="rounded-lg bg-warning/10 p-3 text-sm">{report.rejectionReason}</p>
              )}
              {report.media?.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {report.media.map(
                    (media) =>
                      media.viewUrl && (
                        <a
                          key={media.fileId}
                          href={media.viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-sm underline"
                        >
                          {media.originalFilename ?? t('sellerAppraisals.media')}
                        </a>
                      ),
                  )}
                </div>
              )}
              {report.status === 'SUBMITTED' &&
                submitted?.id === report.id &&
                rejectionCount < 3 && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={accept.isPending || reject.isPending}
                      onClick={() => void reportAction(report.id, 'accept')}
                    >
                      {t('sellerAppraisals.acceptReport')}
                    </Button>
                    <form
                      className="flex flex-1 flex-wrap gap-2"
                      onSubmit={(event) => {
                        event.preventDefault()
                        const reason = new FormData(event.currentTarget).get('reason')
                        if (String(reason).trim())
                          void reportAction(report.id, 'reject', String(reason).trim())
                      }}
                    >
                      <input
                        name="reason"
                        required
                        minLength="1"
                        maxLength="2000"
                        placeholder={t('sellerAppraisals.rejectionReason')}
                        className="min-h-11 min-w-48 flex-1 rounded-lg border border-input bg-background px-3"
                      />
                      <Button variant="outline" disabled={accept.isPending || reject.isPending}>
                        {t('sellerAppraisals.rejectReport')}
                      </Button>
                    </form>
                  </div>
                )}
              {report.status === 'SUBMITTED' && rejectionCount >= 3 && (
                <p className="rounded-lg bg-warning/10 p-3 text-sm">
                  {t('sellerAppraisals.revisionLimitReached')}
                </p>
              )}
            </article>
          ))
        )}
      </section>
      {review.data ? (
        <p className="rounded-xl border border-border bg-card p-5">
          {t('sellerAppraisals.reviewExists')} · {review.data.rating}/5
        </p>
      ) : (
        canReview && (
          <form
            onSubmit={submitReview}
            className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
          >
            <h2 className="text-lg font-semibold sm:col-span-2">
              {t('sellerAppraisals.reviewTitle')}
            </h2>
            {[
              ['rating', 'rating'],
              ['accuracy', 'accuracy'],
              ['professionalism', 'professionalism'],
              ['communication', 'communication'],
              ['timeliness', 'timeliness'],
            ].map(([name, label]) => (
              <label key={name} className="grid gap-2 text-sm">
                {t(`sellerAppraisals.${label}`)}
                <select
                  name={name}
                  required
                  defaultValue="5"
                  className="min-h-11 rounded-lg border border-input bg-background px-3"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="recommend" />
              {t('sellerAppraisals.recommend')}
            </label>
            <label className="grid gap-2 text-sm sm:col-span-2">
              {t('sellerAppraisals.comment')}
              <textarea
                name="comment"
                maxLength="2000"
                rows="3"
                className="rounded-lg border border-input bg-background p-3"
              />
            </label>
            <Button disabled={createReview.isPending} className="sm:justify-self-start">
              {t('sellerAppraisals.submitReview')}
            </Button>
          </form>
        )
      )}
    </main>
  )
}
