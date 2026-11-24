import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const statusTone = {
  OPEN: {
    pill: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
    dot: 'bg-sky-500',
    pulse: true,
  },
  PENDING_APPROVAL: {
    pill: 'border-warning/30 bg-warning/10 text-warning',
    dot: 'bg-warning',
    pulse: true,
  },
  APPROVED: {
    pill: 'border-success/30 bg-success/10 text-success',
    dot: 'bg-success',
    pulse: false,
  },
  REJECTED: {
    pill: 'border-destructive/30 bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
    pulse: false,
  },
  CANCELLED: {
    pill: 'border-border bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
    pulse: false,
  },
}

/** @param {{ status: string, className?: string }} props */
export function DisputeStatusBadge({ status, className }) {
  const { t } = useTranslation()
  const labelKey = `disputes.status.${status}`
  const label = t(labelKey, { defaultValue: status })
  const meta = statusTone[status] ?? {
    pill: 'border-border bg-muted text-foreground',
    dot: 'bg-muted-foreground',
    pulse: false,
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.pill,
        className,
      )}
    >
      <span className="relative inline-flex size-2 shrink-0" aria-hidden="true">
        {meta.pulse && (
          <span
            className={cn(
              'absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping',
              meta.dot,
            )}
          />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', meta.dot)} />
      </span>
      {label}
    </span>
  )
}
