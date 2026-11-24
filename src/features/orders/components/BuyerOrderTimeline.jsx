import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { OrderDate } from '@/features/orders/components/OrderDate'
import { cn } from '@/lib/utils'

const standardSteps = ['createdAt', 'confirmedAt', 'shippedAt', 'deliveredAt', 'completedAt']

function hasValidDate(order, field) {
  return (
    typeof order?.[field] === 'string' &&
    Boolean(order[field]) &&
    Number.isFinite(Date.parse(order[field]))
  )
}

/** @param {{ order: object }} props */
export function BuyerOrderTimeline({ order }) {
  const { t } = useTranslation()
  const isCancelled = order?.status === 'CANCELLED' || hasValidDate(order, 'cancelledAt')

  const reachedStandard = standardSteps.filter((field) => hasValidDate(order, field))
  let steps

  if (isCancelled) {
    steps = [
      ...reachedStandard.map((field) => ({ field, state: 'done' })),
      { field: 'cancelledAt', state: 'cancelled' },
    ]
  } else if (reachedStandard.length === 0) {
    steps = []
  } else {
    const lastReachedIndex = standardSteps.reduce(
      (maxIndex, field, index) => (hasValidDate(order, field) ? index : maxIndex),
      -1,
    )
    steps = standardSteps.map((field, index) => {
      if (index < lastReachedIndex) return { field, state: 'done' }
      if (index === lastReachedIndex) {
        return { field, state: field === 'completedAt' ? 'done' : 'current' }
      }
      return { field, state: 'upcoming' }
    })
  }

  return (
    <section className="order-card" aria-labelledby="order-timeline-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="order-timeline-title" className="font-sans text-base font-semibold tracking-tight">
          {t('orders.timeline.title')}
        </h2>
        {order?.paymentMethod && (
          <span className="inline-flex items-center rounded-full border border-border bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {t('checkout.methods.' + order.paymentMethod, {
              defaultValue: order.paymentMethod,
            })}
            {order.paymentStatus
              ? ' • ' +
                t('transactions.status.' + order.paymentStatus, {
                  defaultValue: order.paymentStatus,
                })
              : ''}
          </span>
        )}
      </div>

      {steps.length > 0 ? (
        <ol
          className="relative mt-1 grid gap-0 text-sm"
          aria-label={t('orders.timeline.listLabel')}
        >
          {steps.map(({ field, state }, index) => {
            const isLast = index === steps.length - 1
            const hasTimestamp = hasValidDate(order, field)
            return (
              <li key={field} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-6 bottom-0 left-[11px] w-px',
                      state === 'done' ? 'bg-foreground/30' : 'bg-border',
                    )}
                  />
                )}

                <span
                  aria-hidden="true"
                  className={cn(
                    'relative z-10 mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                    state === 'cancelled' && 'border-destructive bg-destructive text-white',
                    state === 'done' && 'border-primary bg-primary text-primary-foreground',
                    state === 'current' && 'border-primary bg-background ring-4 ring-primary/15',
                    state === 'upcoming' && 'border-border bg-background',
                  )}
                >
                  {state === 'done' && <Check className="size-3.5" />}
                  {state === 'cancelled' && <X className="size-3.5" />}
                  {state === 'current' && <span className="size-2 rounded-full bg-primary" />}
                </span>

                <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 pt-0.5">
                  <span
                    className={cn(
                      'text-sm',
                      state === 'upcoming'
                        ? 'font-normal text-muted-foreground'
                        : 'font-semibold text-foreground',
                      state === 'cancelled' && 'text-destructive',
                    )}
                  >
                    {t('storeOrders.progress.milestones.' + field)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {hasTimestamp ? <OrderDate value={order[field]} /> : '—'}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">{t('orders.timeline.empty')}</p>
      )}
    </section>
  )
}
