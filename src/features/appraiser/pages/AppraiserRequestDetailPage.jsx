import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { AppraiserStatusBadge } from '@/features/appraiser/components/AppraiserStatusBadge'
import { AppraiserPageShell } from '@/features/appraiser/components/AppraiserPageShell'
import {
  useMyAppraiserProfile,
  useAppraisalRequest,
  useApplyToAppraisalRequest,
} from '@/features/appraiser/hooks/useAppraiserData'
import { applicationSchema } from '@/features/appraiser/schemas/appraiserSchemas'
import { useSession } from '@/features/auth/hooks/useSession'
import { formatLocalDate, formatVnd } from '@/features/appraiser/utils/formatters'
import { useCurrentTime } from '@/features/appraiser/hooks/useCurrentTime'

export function AppraiserRequestDetailPage() {
  const { t, i18n } = useTranslation()
  const { requestId } = useParams()
  const now = useCurrentTime()
  const { profileQuery: sessionQuery } = useSession()
  const userId = sessionQuery.data?.id
  const requestQuery = useAppraisalRequest(userId, requestId)
  const appraiserQuery = useMyAppraiserProfile(userId)
  const applyMutation = useApplyToAppraisalRequest(userId, requestId)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(applicationSchema),
    mode: 'onTouched',
    defaultValues: {
      introduction: '',
      experienceDescription: '',
      proposedFee: '',
      estimatedCompletionHours: '',
    },
  })

  async function submitApplication(values) {
    setSubmitError('')
    setSuccess(false)
    try {
      await applyMutation.mutateAsync({
        introduction: values.introduction,
        experienceDescription: values.experienceDescription,
        proposedFee: values.proposedFee,
        estimatedCompletionHours: values.estimatedCompletionHours,
      })
      setSuccess(true)
    } catch (error) {
      setSubmitError(
        error?.status === 403
          ? 'appraiser.requestDetail.forbiddenError'
          : error?.status === 409 || error?.status === 400
            ? 'appraiser.requestDetail.requestChanged'
            : 'appraiser.errors.submitFailed',
      )
      void requestQuery.refetch()
    }
  }

  if (requestQuery.isPending) {
    return (
      <AppraiserPageShell
        title={t('appraiser.requestDetail.title')}
        description={t('appraiser.requestDetail.description')}
      >
        <p
          role="status"
          className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground"
        >
          {t('appraiser.requestDetail.loading')}
        </p>
      </AppraiserPageShell>
    )
  }

  if (requestQuery.isError) {
    return (
      <AppraiserPageShell
        title={t('appraiser.requestDetail.title')}
        description={t('appraiser.requestDetail.description')}
      >
        {requestQuery.error?.status === 403 ? (
          <ForbiddenState />
        ) : (
          <ErrorState
            title={t('appraiser.requestDetail.errorTitle')}
            description={t('appraiser.requestDetail.errorDescription')}
            onRetry={() => void requestQuery.refetch()}
            isRetrying={requestQuery.isFetching}
          />
        )}
      </AppraiserPageShell>
    )
  }

  const request = requestQuery.data
  const appraiser = appraiserQuery.data
  const profilePending = appraiserQuery.isPending
  const deadlinePassed = request.deadline && now > 0 && new Date(request.deadline).getTime() < now
  const isOwnRequest = Boolean(appraiser?.userId && request.sellerId === appraiser.userId)
  const appraiserActive = appraiser?.status === 'ACTIVE'

  return (
    <AppraiserPageShell
      title={t('appraiser.requestDetail.title')}
      description={t('appraiser.requestDetail.description')}
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <AppraiserStatusBadge domain="request" status={request.status} />
            <span className="text-xs text-muted-foreground">
              {t('appraiser.requestDetail.reference', { id: request.id })}
            </span>
          </div>
          <h2 className="mt-4 text-xl font-semibold">{t('appraiser.requestDetail.requestInfo')}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{request.description}</p>
          <dl className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('appraiser.requestDetail.listingId')}
              </dt>
              <dd className="mt-1 break-all font-mono text-xs">{request.listingId}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('appraiser.requestDetail.sellerReference')}
              </dt>
              <dd className="mt-1 break-all font-mono text-xs">{request.sellerId}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('appraiser.requestDetail.expectedPrice')}
              </dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums">
                {formatVnd(request.expectedPrice, i18n.language)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('appraiser.requestDetail.deadline')}
              </dt>
              <dd className="mt-1 text-sm">{formatLocalDate(request.deadline, i18n.language)}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
            {t('appraiser.requestDetail.listingLimit')}
          </p>
        </section>

        {deadlinePassed ? (
          <EmptyState
            title={t('appraiser.requestDetail.deadlinePassedTitle')}
            description={t('appraiser.requestDetail.deadlinePassedDescription')}
          />
        ) : isOwnRequest ? (
          <EmptyState
            title={t('appraiser.requestDetail.ownRequestTitle')}
            description={t('appraiser.requestDetail.ownRequestDescription')}
          />
        ) : request.status !== 'OPEN' ? (
          <EmptyState
            title={t('appraiser.requestDetail.closedTitle')}
            description={t('appraiser.requestDetail.closedDescription')}
          />
        ) : !appraiserQuery.isSuccess && appraiserQuery.isError ? (
          <section className="space-y-3">
            {appraiserQuery.error?.code === 'APPRAISER_PROFILE_NOT_FOUND' ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold">
                  {t('appraiser.requestDetail.profileRequiredTitle')}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('appraiser.requestDetail.profileRequiredDescription')}
                </p>
                <Button asChild className="mt-4">
                  <Link to="/appraiser/profile">{t('appraiser.requestDetail.profileLink')}</Link>
                </Button>
              </div>
            ) : (
              <ErrorState
                title={t('appraiser.profile.errorTitle')}
                description={t('appraiser.profile.errorDescription')}
                onRetry={() => void appraiserQuery.refetch()}
                isRetrying={appraiserQuery.isFetching}
              />
            )}
          </section>
        ) : profilePending ? (
          <p
            role="status"
            className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground"
          >
            {t('appraiser.profile.loading')}
          </p>
        ) : !appraiserActive ? (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <AppraiserStatusBadge domain="appraiser" status={appraiser.status} />
              <p className="text-sm font-medium">
                {t('appraiser.requestDetail.activeProfileRequired')}
              </p>
            </div>
          </div>
        ) : success ? (
          <div
            role="status"
            className="rounded-xl border border-success/30 bg-success/10 p-5 text-sm text-success"
          >
            <p className="font-semibold">{t('appraiser.messages.applicationSent')}</p>
            <p className="mt-1">{t('appraiser.requestDetail.applicationSentHint')}</p>
          </div>
        ) : (
          <form
            noValidate
            aria-busy={applyMutation.isPending}
            onSubmit={handleSubmit(submitApplication)}
            className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:p-6"
          >
            <div>
              <h2 className="text-lg font-semibold">{t('appraiser.requestDetail.applyTitle')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('appraiser.requestDetail.applyDescription')}
              </p>
            </div>
            {submitError && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {t(submitError)}
              </p>
            )}
            <label className="grid gap-2 text-sm font-medium" htmlFor="appraiser-introduction">
              {t('appraiser.requestDetail.introduction')}
              <textarea
                id="appraiser-introduction"
                rows={3}
                maxLength={1000}
                aria-invalid={Boolean(formState.errors.introduction)}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('introduction')}
              />
              {formState.errors.introduction && (
                <span role="alert" className="font-normal text-destructive">
                  {t(formState.errors.introduction.message)}
                </span>
              )}
            </label>
            <label className="grid gap-2 text-sm font-medium" htmlFor="appraiser-experience">
              {t('appraiser.requestDetail.experience')}
              <textarea
                id="appraiser-experience"
                rows={5}
                maxLength={5000}
                aria-invalid={Boolean(formState.errors.experienceDescription)}
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('experienceDescription')}
              />
              {formState.errors.experienceDescription && (
                <span role="alert" className="font-normal text-destructive">
                  {t(formState.errors.experienceDescription.message)}
                </span>
              )}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium" htmlFor="appraiser-proposed-fee">
                {t('appraiser.requestDetail.proposedFee')}
                <input
                  id="appraiser-proposed-fee"
                  type="number"
                  min="0.01"
                  step="0.01"
                  aria-invalid={Boolean(formState.errors.proposedFee)}
                  className="min-h-11 rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('proposedFee')}
                />
                {formState.errors.proposedFee && (
                  <span role="alert" className="font-normal text-destructive">
                    {t(formState.errors.proposedFee.message)}
                  </span>
                )}
              </label>
              <label className="grid gap-2 text-sm font-medium" htmlFor="appraiser-hours">
                {t('appraiser.requestDetail.estimatedHours')}
                <input
                  id="appraiser-hours"
                  type="number"
                  min="1"
                  max="480"
                  step="1"
                  aria-invalid={Boolean(formState.errors.estimatedCompletionHours)}
                  className="min-h-11 rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('estimatedCompletionHours')}
                />
                {formState.errors.estimatedCompletionHours && (
                  <span role="alert" className="font-normal text-destructive">
                    {t(formState.errors.estimatedCompletionHours.message)}
                  </span>
                )}
              </label>
            </div>
            <Button
              type="submit"
              disabled={applyMutation.isPending}
              className="min-h-11 justify-self-start"
            >
              {applyMutation.isPending
                ? t('appraiser.requestDetail.applying')
                : t('appraiser.requestDetail.submitApplication')}
            </Button>
          </form>
        )}
      </div>
    </AppraiserPageShell>
  )
}
