import { useTranslation } from 'react-i18next'

import { getOrderStatusKey } from '@/features/orders/orderStatus'
import { cn } from '@/lib/utils'

const statusToneMap = {
  PENDING_PAYMENT: {
    dot: 'bg-warning',
    pill: 'border-warning/30 bg-warning/10 text-warning',
    live: true,
  },
  PENDING_CONFIRMED: {
    dot: 'bg-warning',
    pill: 'border-warning/30 bg-warning/10 text-warning',
    live: true,
  },
  CONFIRMED: {
    dot: 'bg-info',
    pill: 'border-info/30 bg-info/10 text-info',
    live: false,
  },
  SHIPPING: {
    dot: 'bg-info',
    pill: 'border-info/30 bg-info/10 text-info',
    live: true,
  },
  DELIVERED: {
    dot: 'bg-success',
    pill: 'border-success/30 bg-success/10 text-success',
    live: false,
  },
  COMPLETED: {
    dot: 'bg-success',
    pill: 'border-success/30 bg-success/10 text-success',
    live: false,
  },
  DISPUTED: {
    dot: 'bg-orange-500',
    pill: 'border-orange-300 bg-orange-50 text-orange-700',
    live: true,
  },
  CANCELLED: {
    dot: 'bg-muted-foreground/60',
    pill: 'border-border bg-muted/60 text-muted-foreground',
    live: false,
  },
  EXPIRED: {
    dot: 'bg-muted-foreground/60',
    pill: 'border-border bg-muted/60 text-muted-foreground',
    live: false,
  },
  REFUNDED: {
    dot: 'bg-violet-600',
    pill: 'border-violet-200 bg-violet-50 text-violet-700',
    live: false,
  },
}

/** @param {{ status: string, compact?: boolean, title?: string }} props */
export function OrderStatusLabel({ status, compact = false, title }) {
  const { t } = useTranslation()
  const tone = statusToneMap[status] ?? {
    dot: 'bg-muted-foreground/60',
    pill: 'border-border bg-surface-subtle text-foreground',
    live: false,
  }
  const labelKey =
    compact && status === 'PENDING_CONFIRMED'
      ? 'storeOrders.shortStatuses.pendingConfirmed'
      : getOrderStatusKey(status)
  const mutedCompleted = compact && status === 'COMPLETED'

  return (
    <span
      title={title}
      className={cn(
        'order-status inline-flex items-center gap-1.5 whitespace-nowrap',
        compact && 'px-2.5 py-0.5 text-xs',
        mutedCompleted ? 'border-emerald-200/70 bg-emerald-50/50 text-emerald-700/75' : tone.pill,
      )}
    >
      <span aria-hidden="true" className="relative inline-flex size-2 shrink-0">
        {tone.live && (
          <span
            className={cn(
              'absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping',
              tone.dot,
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            mutedCompleted ? 'bg-emerald-500/60' : tone.dot,
          )}
        />
      </span>
      <span>{t(labelKey)}</span>
    </span>
  )
}
