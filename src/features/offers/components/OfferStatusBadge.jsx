import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
const TONE_BY_STATUS = {
  PENDING: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'muted',
  EXPIRED: 'muted',
  SUPERSEDED: 'muted',
}

/** @param {{ status?: string, className?: string }} props */
export function OfferStatusBadge({ status, className }) {
  const { t } = useTranslation()
  const tone = TONE_BY_STATUS[status] ?? 'muted'

  return (
    <span className={cn('offer-status-badge', className)} data-tone={tone}>
      <span aria-hidden="true" className="offer-status-dot" />
      <span>{t(`offers.status.${status}`, { defaultValue: status ?? '—' })}</span>
    </span>
  )
}
