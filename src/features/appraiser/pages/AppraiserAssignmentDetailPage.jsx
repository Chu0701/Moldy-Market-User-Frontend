import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, FileText, Image, MessageCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useBlocker, useParams } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import { ConfirmActionButton } from '@/features/appraiser/components/ConfirmActionButton'
import {
  useAppraisalAssignment,
  useAppraisalReportHistory,
  useCancelAppraisalAssignment,
  useStartAppraisalAssignment,
  useSubmitAppraisalReport,
} from '@/features/appraiser/hooks/useAppraiserData'
import {
  appraisalReportSchema,
  parseEvidenceLines,
} from '@/features/appraiser/schemas/appraiserSchemas'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'

function safeEvidenceHref(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export function AppraiserAssignmentDetailPage() {
  const { t, i18n } = useTranslation()
  const { assignmentId } = useParams()
  const { profileQuery: sessionQuery } = useSession()
  const userId = sessionQuery.data?.id
  const assignmentQuery = useAppraisalAssignment(userId, assignmentId)
  const historyQuery = useAppraisalReportHistory(userId, assignmentId, assignmentQuery.isSuccess)
  const startMutation = useStartAppraisalAssignment(userId, assignmentId)
  const cancelMutation = useCancelAppraisalAssignment(userId, assignmentId)
  const submitMutation = useSubmitAppraisalReport(userId, assignmentId)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [evidenceError, setEvidenceError] = useState('')
  const { register, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(appraisalReportSchema),
    mode: 'onTouched',
    defaultValues: {
      description: '',
      conditionAssessment: '',
      assessedValue: '',
      imageUrls: '',
      documentUrls: '',
    },
  })
  const blocker = useBlocker(formState.isDirty && !submitMutation.isSuccess)

  useEffect(() => {
    if (!formState.isDirty || submitMutation.isSuccess) return undefined
    const warnBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [formState.isDirty, submitMutation.isSuccess])

  async function startAssignment() {
    setActionError('')
    setActionMessage('')
    try {
      await startMutation.mutateAsync()
      setActionMessage('appraiser.messages.assignmentStarted')
    } catch {
      setActionError('appraiser.errors.submitFailed')
      void assignmentQuery.refetch()
    }
  }

  async function cancelAssignment() {
    setActionError('')
    setActionMessage('')
    try {
      await cancelMutation.mutateAsync()
      setActionMessage('appraiser.messages.assignmentCancelled')
    } catch {
      setActionError('appraiser.errors.submitFailed')
      void assignmentQuery.refetch()
    }
  }

  async function submitReport(values) {
    setActionError('')
    setEvidenceError('')
    setActionMessage('')
    const imageUrls = parseEvidenceLines(values.imageUrls)
    const documentUrls = parseEvidenceLines(values.documentUrls)
    if (imageUrls.length > 10 || documentUrls.length > 10) {
      setEvidenceError('appraiser.validation.evidenceMax')
      return
    }

    try {
      await submitMutation.mutateAsync({
        description: values.description,
        conditionAssessment: values.conditionAssessment,
        assessedValue: values.assessedValue,
        imageUrls,
        documentUrls,
      })
      setActionMessage('appraiser.messages.reportSubmitted')
      reset(values)
    } catch {
      setActionError('appraiser.errors.submitFailed')
      void historyQuery.refetch()
      void assignmentQuery.refetch()
    }
  }

  if (assignmentQuery.isPending) {
    return (
      <AppraiserPageShell
        title={t('appraiser.assignmentDetail.title')}
        description={t('appraiser.assignmentDetail.description')}
      >
        <p
          role="status"
          className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground"
        >
          {t('appraiser.assignmentDetail.loading')}
        </p>
      </AppraiserPageShell>
    )
  }

  if (assignmentQuery.isError) {
    return (
      <AppraiserPageShell
        title={t('appraiser.assignmentDetail.title')}
        description={t('appraiser.assignmentDetail.description')}
      >
        {assignmentQuery.error?.status === 403 ? (
          <ForbiddenState />
        ) : (
          <ErrorState
            title={t('appraiser.assignmentDetail.errorTitle')}
            description={t('appraiser.assignmentDetail.errorDescription')}
            onRetry={() => void assignmentQuery.refetch()}
            isRetrying={assignmentQuery.isFetching}
          />
        )}
      </AppraiserPageShell>
    )
  }

  const assignment = assignmentQuery.data
  const reports = historyQuery.data ?? []
  const hasSubmittedReport = reports.some((report) => report.status === 'SUBMITTED')
  const rejectionCount = reports.filter((report) => report.status === 'REJECTED').length
  const canCancel = ['ASSIGNED', 'IN_PROGRESS'].includes(assignment.status)
  const canStart = assignment.status === 'ASSIGNED'
  const canSubmitReport =
    assignment.status === 'IN_PROGRESS' && !hasSubmittedReport && rejectionCount < 3

  return (
    <AppraiserPageShell
      title={t('appraiser.assignmentDetail.title')}
      description={t('appraiser.assignmentDetail.description')}
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <AppraiserStatusBadge domain="assignment" status={assignment.status} />
                <span className="text-xs text-muted-foreground">
                  {t('appraiser.assignmentDetail.reference', { id: assignment.id })}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold">
                {t('appraiser.assignmentDetail.requestReference', {
                  id: assignment.appraisalRequestId,
                })}
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('appraiser.assignmentDetail.agreedFee')}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold tabular-nums">
                    {formatVnd(assignment.agreedFee, i18n.language)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {t('appraiser.assignmentDetail.assignedAt')}
                  </dt>
                  <dd className="mt-1 text-sm">
                    {formatLocalDate(assignment.assignedAt, i18n.language)}
                  </dd>
                </div>
                {assignment.startedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t('appraiser.assignmentDetail.startedAt')}
                    </dt>
                    <dd className="mt-1 text-sm">
                      {formatLocalDate(assignment.startedAt, i18n.language)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            <div className="flex flex-wrap gap-2">
              {canStart && (
                <ConfirmActionButton
                  label={t('appraiser.assignmentDetail.start')}
                  title={t('appraiser.assignmentDetail.startConfirmTitle')}
                  description={t('appraiser.assignmentDetail.startConfirmDescription')}
                  confirmLabel={t('appraiser.assignmentDetail.start')}
                  disabled={startMutation.isPending || cancelMutation.isPending}
                  onConfirm={startAssignment}
                />
              )}
              {canCancel && (
                <ConfirmActionButton
                  label={t('appraiser.assignmentDetail.cancel')}
                  title={t('appraiser.assignmentDetail.cancelConfirmTitle')}
                  description={t('appraiser.assignmentDetail.cancelConfirmDescription')}
                  confirmLabel={t('appraiser.assignmentDetail.cancel')}
                  variant="outline"
                  disabled={cancelMutation.isPending || startMutation.isPending}
                  onConfirm={cancelAssignment}
                />
              )}
            </div>
          </div>
          {assignment.conversationId && (
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
              <MessageCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {t('appraiser.assignmentDetail.chatUnavailable')}
            </p>
          )}
        </section>

        {actionMessage && (
          <p role="status" className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            {t(actionMessage)}
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

        <section className="space-y-4 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">
              {t('appraiser.assignmentDetail.reportHistoryTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('appraiser.assignmentDetail.reportHistoryDescription')}
            </p>
          </div>
          {historyQuery.isPending ? (
            <p role="status" className="text-sm text-muted-foreground">
              {t('appraiser.assignmentDetail.loadingHistory')}
            </p>
          ) : historyQuery.isError ? (
            historyQuery.error?.status === 403 ? (
              <ForbiddenState />
            ) : (
              <ErrorState
                title={t('appraiser.assignmentDetail.historyErrorTitle')}
                description={t('appraiser.assignmentDetail.historyErrorDescription')}
                onRetry={() => void historyQuery.refetch()}
                isRetrying={historyQuery.isFetching}
              />
            )
          ) : reports.length === 0 ? (
            <EmptyState
              title={t('appraiser.assignmentDetail.noReportsTitle')}
              description={t('appraiser.assignmentDetail.noReportsDescription')}
            />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <article key={report.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <AppraiserStatusBadge domain="report" status={report.status} />
                    <span className="text-xs text-muted-foreground">
                      {t('appraiser.assignmentDetail.revision', { number: report.revisionNumber })}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatLocalDate(report.submittedAt, i18n.language)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold tabular-nums">
                    {formatVnd(report.assessedValue, i18n.language)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{report.description}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground">
                        {t('appraiser.assignmentDetail.conditionAssessment')}
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                        {report.conditionAssessment}
                      </p>
                    </div>
                    {report.rejectionReason && (
                      <div className="rounded-lg bg-warning/10 p-3">
                        <h3 className="text-xs font-semibold text-warning">
                          {t('appraiser.assignmentDetail.rejectionReason')}
                        </h3>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                          {report.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                  {(report.imageUrls?.length > 0 || report.documentUrls?.length > 0) && (
                    <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                      {[
                        ['imageUrls', report.imageUrls, Image],
                        ['documentUrls', report.documentUrls, FileText],
                      ].map(
                        ([key, urls, Icon]) =>
                          urls?.length > 0 && (
                            <div key={key}>
                              <h3 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                <Icon aria-hidden="true" className="size-4" />
                                {t(`appraiser.assignmentDetail.${key}`)}
                              </h3>
                              <ul className="mt-2 space-y-1.5 text-sm">
                                {urls.map((url) => {
                                  const href = safeEvidenceHref(url)
                                  return (
                                    <li key={url} className="break-all">
                                      {href ? (
                                        <a
                                          href={href}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="underline underline-offset-4"
                                        >
                                          {url}
                                        </a>
                                      ) : (
                                        <span className="text-muted-foreground">
                                          {t('appraiser.assignmentDetail.invalidEvidence')}
                                        </span>
                                      )}
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          ),
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {canSubmitReport && historyQuery.isSuccess && (
          <form
            noValidate
            aria-busy={submitMutation.isPending}
            onSubmit={handleSubmit(submitReport)}
            className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:p-6"
          >
            <div>
              <h2 className="text-lg font-semibold">
                {t('appraiser.assignmentDetail.submitReportTitle')}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t('appraiser.assignmentDetail.submitReportHint')}
              </p>
            </div>
            {formState.isDirty && (
              <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs leading-5 text-warning">
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {t('appraiser.assignmentDetail.noDraftWarning')}
              </p>
            )}
            {evidenceError && (
              <p role="alert" className="text-sm text-destructive">
                {t(evidenceError)}
              </p>
            )}
            <label className="grid gap-2 text-sm font-medium" htmlFor="report-description">
              {t('appraiser.assignmentDetail.description')}
              <textarea
                id="report-description"
                rows={5}
                maxLength={5000}
                aria-invalid={Boolean(formState.errors.description)}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('description')}
              />
              {formState.errors.description && (
                <span role="alert" className="font-normal text-destructive">
                  {t(formState.errors.description.message)}
                </span>
              )}
            </label>
            <label className="grid gap-2 text-sm font-medium" htmlFor="report-condition">
              {t('appraiser.assignmentDetail.conditionAssessment')}
              <textarea
                id="report-condition"
                rows={5}
                maxLength={5000}
                aria-invalid={Boolean(formState.errors.conditionAssessment)}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('conditionAssessment')}
              />
              {formState.errors.conditionAssessment && (
                <span role="alert" className="font-normal text-destructive">
                  {t(formState.errors.conditionAssessment.message)}
                </span>
              )}
            </label>
            <label className="grid max-w-sm gap-2 text-sm font-medium" htmlFor="report-value">
              {t('appraiser.assignmentDetail.assessedValue')}
              <input
                id="report-value"
                type="number"
                min="0.01"
                step="0.01"
                aria-invalid={Boolean(formState.errors.assessedValue)}
                className="min-h-11 rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('assessedValue')}
              />
              {formState.errors.assessedValue && (
                <span role="alert" className="font-normal text-destructive">
                  {t(formState.errors.assessedValue.message)}
                </span>
              )}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium" htmlFor="report-images">
                {t('appraiser.assignmentDetail.imageUrls')}
                <textarea
                  id="report-images"
                  rows={3}
                  placeholder={t('appraiser.assignmentDetail.urlPlaceholder')}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('imageUrls')}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium" htmlFor="report-documents">
                {t('appraiser.assignmentDetail.documentUrls')}
                <textarea
                  id="report-documents"
                  rows={3}
                  placeholder={t('appraiser.assignmentDetail.urlPlaceholder')}
                  className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('documentUrls')}
                />
              </label>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {t('appraiser.assignmentDetail.evidenceNotice')}
            </p>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="min-h-11 justify-self-start"
            >
              {submitMutation.isPending
                ? t('appraiser.assignmentDetail.submitting')
                : t('appraiser.assignmentDetail.submitReport')}
            </Button>
          </form>
        )}

        {rejectionCount >= 3 && assignment.status === 'IN_PROGRESS' && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning"
          >
            <X aria-hidden="true" className="size-4" />
            {t('appraiser.assignmentDetail.rejectionLimit')}
          </p>
        )}

        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-leave-title"
              className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg sm:p-6"
            >
              <h2 id="report-leave-title" className="text-xl font-semibold">
                {t('appraiser.assignmentDetail.leaveTitle')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t('appraiser.assignmentDetail.leaveDescription')}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => blocker.reset()}>
                  {t('appraiser.assignmentDetail.stay')}
                </Button>
                <Button type="button" variant="destructive" onClick={() => blocker.proceed()}>
                  {t('appraiser.assignmentDetail.leave')}
                </Button>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppraiserPageShell>
  )
}
