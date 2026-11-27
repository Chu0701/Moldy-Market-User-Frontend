import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

const TEN_MINUTES_MS = 10 * 60 * 1000
const ONE_HOUR_MS = 60 * 60 * 1000

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

/**
 * Live countdown badge that turns amber below 1h and red below 10m.
 * @param {{
 *   targetIso?: string | null,
 *   prefix?: string,
 *   expiredLabel?: string,
 *   className?: string,
 *   onExpire?: () => void,
 * }} props
 */
export function OfferCountdown({ targetIso, prefix, expiredLabel, className, onExpire }) {
  const { t } = useTranslation()
  const targetMs = targetIso ? Date.parse(targetIso) : Number.NaN
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return undefined
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= targetMs) {
        window.clearInterval(timer)
        onExpire?.()
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [targetMs, onExpire])

  if (!Number.isFinite(targetMs)) return null

  const remaining = targetMs - now
  let urgency = 'normal'
  if (remaining <= 0) urgency = 'expired'
  else if (remaining < TEN_MINUTES_MS) urgency = 'critical'
  else if (remaining < ONE_HOUR_MS) urgency = 'warning'

  return (
    <span className={cn('offer-countdown', className)} data-urgency={urgency}>
      <Clock aria-hidden="true" className="size-3.5 shrink-0" />
      <span>
        {remaining <= 0
          ? (expiredLabel ?? t('offers.countdown.expired'))
          : `${prefix ? `${prefix} ` : ''}${formatRemaining(remaining)}`}
      </span>
    </span>
  )
}
