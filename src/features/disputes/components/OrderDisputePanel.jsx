import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { MediaUploadButton } from '@/components/common/MediaUploadButton'
import { DisputeStatusBadge } from '@/features/disputes/components/DisputeStatusBadge'
import {
  useCancelDispute,
  useCreateDispute,
  useOrderDispute,
} from '@/features/disputes/hooks/useDisputes'
import {
  createDisputeSchema,
  DISPUTE_REASONS,
  parseDisputeImageUrls,
} from '@/features/disputes/schemas/disputeSchema'

function mapDisputeError(error) {
  switch (error?.code) {
    case 'DISPUTE_PERIOD_EXPIRED':
      return 'disputes.errors.periodExpired'
    case 'DISPUTE_EXISTED':
    case 'DISPUTE_ALREADY_OPEN':
      return 'disputes.errors.alreadyExists'
    case 'INVALID_ORDER_STATE':
      return 'disputes.errors.invalidOrderState'
    case 'DISPUTE_INVALID_STATE':
      return 'disputes.errors.invalidState'
    default:
      return 'disputes.errors.generic'
  }
}

/**
 * Displays dispute status/actions or dispute creation form on OrderDetailPage.
 * @param {{ order: { id: string, status: string } }} props
 */
export function OrderDisputePanel({ order }) {
  const { t, i18n } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const relevantStatus =
    order.status === 'COMPLETED' || order.status === 'DISPUTED' || order.status === 'REFUNDED'

  const disputeQuery = useOrderDispute(order.id, relevantStatus)
  const createMutation = useCreateDispute()
  const cancelMutation = useCancelDispute()

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createDisputeSchema),
    defaultValues: {
      reason: 'DAMAGED',
      description: '',
      imageUrlsText: '',
    },
  })

  if (!relevantStatus) return null

  const dispute = disputeQuery.data
  const canOpenDispute =
    order.status === 'COMPLETED' && (!dispute || dispute.status === 'CANCELLED')
  const canCancelDispute =
    dispute && (dispute.status === 'OPEN' || dispute.status === 'PENDING_APPROVAL')

  const onSubmit = (values) => {
    createMutation.mutate(
      {
        orderId: order.id,
        reason: values.reason,
        description: values.description,
        imageUrls: parseDisputeImageUrls(values.imageUrlsText),
      },
      {
        onSuccess: () => {
          reset()
          setShowForm(false)
        },
      },
    )
  }

  return (
    <section
      className="space-y-4 rounded-xl border border-border bg-background p-5"
      aria-labelledby="order-dispute-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="order-dispute-heading" className="text-xl font-semibold">
          {t('disputes.orderSectionTitle')}
        </h2>
        {dispute && <DisputeStatusBadge status={dispute.status} />}
      </div>

      {disputeQuery.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          {t('disputes.loading')}
        </p>
      )}

      {disputeQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          {t('disputes.loadError')}
        </p>
      )}

      {dispute && (
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">{t('disputes.reasonLabel')}: </span>
            {t(`disputes.reason.${dispute.reason}`, { defaultValue: dispute.reason })}
          </p>
          <p className="whitespace-pre-wrap text-muted-foreground">{dispute.description}</p>
          {dispute.decisionNote && (
            <p className="rounded-md bg-accent p-3">
              <span className="font-medium">{t('disputes.decisionNoteLabel')}: </span>
              {dispute.decisionNote}
            </p>
          )}
          {dispute.createdAt && (
            <p className="text-xs text-muted-foreground">
              {t('disputes.createdAt', {
                date: new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(dispute.createdAt)),
              })}
            </p>
          )}
          {canCancelDispute && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate({ orderId: order.id })}
              >
                {t(cancelMutation.isPending ? 'disputes.cancelling' : 'disputes.cancelAction')}
              </Button>
              {cancelMutation.isError && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {t(mapDisputeError(cancelMutation.error))}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {canOpenDispute && !showForm && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('disputes.openHint')}</p>
          <Button type="button" variant="outline" onClick={() => setShowForm(true)}>
            {t(dispute?.status === 'CANCELLED' ? 'disputes.reopenAction' : 'disputes.openAction')}
          </Button>
        </div>
      )}

      {canOpenDispute && showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="dispute-reason" className="block text-sm font-medium">
              {t('disputes.reasonLabel')}
            </label>
            <select
              id="dispute-reason"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              aria-invalid={Boolean(errors.reason)}
              {...register('reason')}
            >
              {DISPUTE_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {t(`disputes.reason.${reason}`)}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p role="alert" className="text-xs text-destructive">
                {t(errors.reason.message)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="dispute-description" className="block text-sm font-medium">
              {t('disputes.descriptionLabel')}
            </label>
            <textarea
              id="dispute-description"
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'dispute-description-error' : undefined}
              placeholder={t('disputes.descriptionPlaceholder')}
              {...register('description')}
            />
            {errors.description && (
              <p id="dispute-description-error" role="alert" className="text-xs text-destructive">
                {t(errors.description.message)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="dispute-images" className="block text-sm font-medium">
              {t('disputes.imagesLabel')}
            </label>
            <textarea
              id="dispute-images"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              aria-invalid={Boolean(errors.imageUrlsText)}
              aria-describedby={errors.imageUrlsText ? 'dispute-images-error' : undefined}
              placeholder={t('disputes.imagesPlaceholder')}
              {...register('imageUrlsText')}
            />
            <MediaUploadButton
              purpose="DISPUTE_EVIDENCE"
              disabled={createMutation.isPending}
              onUploaded={(url) => {
                const current = getValues('imageUrlsText')?.trim()
                setValue('imageUrlsText', current ? `${current}\n${url}` : url, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }}
            />
            {errors.imageUrlsText && (
              <p id="dispute-images-error" role="alert" className="text-xs text-destructive">
                {t(errors.imageUrlsText.message)}
              </p>
            )}
          </div>

          {createMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {t(mapDisputeError(createMutation.error))}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {t(createMutation.isPending ? 'disputes.submitting' : 'disputes.submitAction')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setShowForm(false)}
            >
              {t('disputes.closeForm')}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
