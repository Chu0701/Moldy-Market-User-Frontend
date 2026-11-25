import { useTranslation } from 'react-i18next'

const statusTone = {
  PENDING: 'bg-warning/10 text-warning',
  OPEN: 'bg-info/10 text-info',
  ASSIGNED: 'bg-info/10 text-info',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  SUBMITTED: 'bg-warning/10 text-warning',
  ACTIVE: 'bg-success/10 text-success',
  ACCEPTED: 'bg-success/10 text-success',
  COMPLETED: 'bg-success/10 text-success',
  PAID: 'bg-success/10 text-success',
  BASIC: 'bg-info/10 text-info',
  ADVANCED: 'bg-success/10 text-success',
  REJECTED: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-muted text-muted-foreground',
  WITHDRAWN: 'bg-muted text-muted-foreground',
  EXPIRED: 'bg-muted text-muted-foreground',
  INACTIVE: 'bg-muted text-muted-foreground',
  SUSPENDED: 'bg-destructive/10 text-destructive',
  UNVERIFIED: 'bg-muted text-muted-foreground',
  EARNED: 'bg-info/10 text-info',
}

/** @param {{ domain: string, status?: string|null }} props */
export function AppraiserStatusBadge({ domain, status }) {
  const { t } = useTranslation()
  const key = typeof status === 'string' ? status : 'UNKNOWN'
  const labelKey = `appraiser.status.${domain}.${key}`
  const label = t(labelKey, { defaultValue: t('appraiser.status.unknown') })

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[key] ?? 'bg-muted text-muted-foreground'}`}
    >
      {label}
    </span>
  )
}
