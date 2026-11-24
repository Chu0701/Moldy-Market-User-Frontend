import { useEffect } from 'react'
import { Check, ExternalLink, ShieldCheck, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { DisputeStatusBadge } from '@/features/disputes/components/DisputeStatusBadge'
import { useCancelDispute, useOrderDispute } from '@/features/disputes/hooks/useDisputes'
import { OrderDate } from '@/features/orders/components/OrderDate'
import { cn } from '@/lib/utils'

/**
 * Slide-over modal displaying full buyer dispute details, evidence gallery, timeline, and withdrawal action.
 * @param {{
 *   summary: {
 *     id: string,
 *     orderId: string,
 *     orderCode?: string,
 *     firstItemTitle?: string,
 *     firstItemImageUrl?: string,
 *     totalAmount?: number,
 *     reason: string,
 *     status: string,
 *     decisionNote?: string,
 *     createdAt?: string,
 *   },
 *   onClose: () => void,
 * }} props
 */
export function DisputeDetailModal({ summary, onClose }) {
  const { t } = useTranslation()
  const detailQuery = useOrderDispute(summary.orderId, true)
  const cancelMutation = useCancelDispute()

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const detail = detailQuery.data
  const status = detail?.status ?? summary.status
  const createdAt = detail?.createdAt ?? summary.createdAt
  const decisionNote = detail?.decisionNote ?? summary.decisionNote
  const canWithdraw = status === 'OPEN' || status === 'PENDING_APPROVAL'
  const displayOrderCode = summary.orderCode || summary.orderId

  const isResolved = status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELLED'
  const steps = [
    {
      key: 'submitted',
      label: t('disputes.timeline.submitted'),
      time: createdAt,
      state: 'done',
    },
    {
      key: 'reviewing',
      label: t('disputes.timeline.reviewing'),
      time: null,
      state: isResolved ? 'done' : 'current',
    },
    {
      key: 'resolved',
      label:
        status === 'APPROVED'
          ? t('disputes.timeline.approved')
          : status === 'REJECTED'
            ? t('disputes.timeline.rejected')
            : status === 'CANCELLED'
              ? t('disputes.timeline.withdrawn')
              : t('disputes.timeline.outcomePending'),
      time: detail?.reviewedAt,
      state: isResolved ? 'done' : 'upcoming',
    },
  ]

  function handleWithdraw() {
    cancelMutation.mutate(
      { orderId: summary.orderId },
      {
        onSuccess: () => {
          void detailQuery.refetch()
        },
      },
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-detail-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="dispute-detail-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                {t('disputes.detailTitle')}
              </h2>
              <DisputeStatusBadge status={status} />
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {t('disputes.orderRef', { orderId: displayOrderCode })}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t('disputes.closeForm')}
            className="size-9 shrink-0 rounded-full"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3.5 rounded-xl border border-border bg-surface-subtle p-3.5">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
              <ImageWithFallback
                src={summary.firstItemImageUrl}
                alt={summary.firstItemTitle || displayOrderCode}
                compact
                className="size-full"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="line-clamp-2 text-sm font-medium text-foreground">
                {summary.firstItemTitle || t('disputes.orderRef', { orderId: displayOrderCode })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`disputes.reason.${summary.reason}`, { defaultValue: summary.reason })}
              </p>
            </div>
            {summary.totalAmount != null && (
              <div className="shrink-0 text-right">
                <ProductPrice
                  value={summary.totalAmount}
                  className="text-sm font-semibold text-foreground tabular-nums"
                />
              </div>
            )}
          </div>

          {status === 'APPROVED' && summary.totalAmount != null && (
            <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                {t('disputes.outcomeApprovedPrefix')}{' '}
                <ProductPrice value={summary.totalAmount} className="font-semibold tabular-nums" />{' '}
                {t('disputes.outcomeApprovedSuffix')}
              </p>
            </div>
          )}

          {canWithdraw && (
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-subtle px-4 py-3 text-xs leading-5 text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              <p>{t('disputes.escrowHoldNotice')}</p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('disputes.timelineTitle')}
            </h3>
            <ol className="space-y-3 border-l border-border pl-4">
              {steps.map((step) => (
                <li key={step.key} className="relative space-y-0.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-0.5 -left-[22px] inline-flex size-3.5 items-center justify-center rounded-full border',
                      step.state === 'done' && 'border-primary bg-primary text-primary-foreground',
                      step.state === 'current' &&
                        'border-primary bg-background ring-4 ring-primary/15',
                      step.state === 'upcoming' && 'border-border bg-background',
                    )}
                  >
                    {step.state === 'done' && <Check className="size-2.5" strokeWidth={3} />}
                  </span>
                  <p
                    className={cn(
                      'text-sm',
                      step.state === 'upcoming'
                        ? 'text-muted-foreground'
                        : 'font-medium text-foreground',
                    )}
                  >
                    {step.label}
                  </p>
                  {step.time && (
                    <p className="text-xs text-muted-foreground">
                      <OrderDate value={step.time} />
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {detailQuery.isPending ? (
            <div className="space-y-2.5" aria-hidden="true">
              <div className="skeleton-shimmer h-4 w-32 rounded" />
              <div className="skeleton-shimmer h-16 w-full rounded-lg" />
            </div>
          ) : detailQuery.isError ? (
            <ErrorState
              title={t('disputes.loadError')}
              description={t('feedback.checkBack')}
              onRetry={() => void detailQuery.refetch()}
              isRetrying={detailQuery.isFetching}
            />
          ) : (
            <>
              {detail?.description && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('disputes.descriptionLabel')}
                  </h3>
                  <p className="rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-foreground">
                    {detail.description}
                  </p>
                </div>
              )}

              {Array.isArray(detail?.imageUrls) && detail.imageUrls.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {t('disputes.evidenceTitle', { count: detail.imageUrls.length })}
                  </h3>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                    {detail.imageUrls.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ImageWithFallback
                          src={url}
                          alt={t('disputes.evidenceAlt', { index: index + 1 })}
                          compact
                          className="size-full transition-transform duration-150 group-hover:scale-105"
                        />
                        <span className="sr-only">
                          {t('disputes.openEvidence', { index: index + 1 })}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {decisionNote && (
                <div
                  className={cn(
                    'space-y-1 rounded-xl border px-4 py-3',
                    status === 'REJECTED'
                      ? 'border-destructive/30 bg-destructive/5'
                      : 'border-success/30 bg-success/5',
                  )}
                >
                  <h3 className="text-xs font-semibold tracking-wide text-foreground uppercase">
                    {t('disputes.decisionNoteLabel')}
                  </h3>
                  <p className="text-sm leading-6 text-foreground">{decisionNote}</p>
                </div>
              )}
            </>
          )}

          {cancelMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {t('disputes.errors.generic')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-subtle/60 px-5 py-3.5 sm:px-6">
          <Button asChild variant="outline" size="sm">
            <Link to={`/orders/${encodeURIComponent(summary.orderId)}`} onClick={onClose}>
              <ExternalLink aria-hidden="true" className="size-3.5" />
              <span>{t('disputes.viewOrderDetail')}</span>
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {canWithdraw && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={cancelMutation.isPending}
                onClick={handleWithdraw}
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {cancelMutation.isPending ? t('disputes.cancelling') : t('disputes.withdrawAction')}
              </Button>
            )}
            <Button type="button" size="sm" onClick={onClose}>
              {t('disputes.closeForm')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
