import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const statusTone = {
  OPEN: 'border-border bg-accent text-accent-foreground',
  PENDING_APPROVAL: 'border-border bg-accent text-accent-foreground',
  APPROVED: 'border-border bg-primary text-primary-foreground',
  REJECTED: 'border-border bg-secondary text-secondary-foreground',
  CANCELLED: 'border-border bg-muted text-muted-foreground',
}

/** @param {{ status: string, className?: string }} props */
export function DisputeStatusBadge({ status, className }) {
  const { t } = useTranslation()
  const labelKey = `disputes.status.${status}`
  const label = t(labelKey, { defaultValue: status })

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium',
        statusTone[status] ?? 'border-border bg-muted text-foreground',
        className,
      )}
    >
      {label}
    </span>
  )
}
