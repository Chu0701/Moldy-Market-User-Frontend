import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'

function formatRelativeShort(isoValue, locale) {
  if (!isoValue) return ''
  const timestamp = Date.parse(isoValue)
  if (Number.isNaN(timestamp)) return ''
  const diffSeconds = Math.round((timestamp - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)

  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
    if (absSeconds < 60) return rtf.format(0, 'minute')
    if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute')
    if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour')
    if (absSeconds < 2592000) return rtf.format(Math.round(diffSeconds / 86400), 'day')
    if (absSeconds < 31536000) return rtf.format(Math.round(diffSeconds / 2592000), 'month')
    return rtf.format(Math.round(diffSeconds / 31536000), 'year')
  } catch {
    return ''
  }
}

/**
 * Compact horizontal "Just listed" strip directly below the Hero using real newest products.
 * Uses buttons (not links) so product card link accessibility queries stay unique.
 *
 * @param {{ products?: Array<object> }} props
 */
export function RecentListingsTicker({ products = [] }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  if (!Array.isArray(products) || products.length < 2) return null

  return (
    <div
      aria-label={t('hero.justListedLabel')}
      className="mt-4 flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card px-3.5 py-2.5"
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-foreground">
        <span className="relative inline-flex size-2" aria-hidden="true">
          <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span>{t('hero.justListedLabel')}</span>
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.slice(0, 6).map((item) => {
          const timeText = formatRelativeShort(item.createdAt, i18n.resolvedLanguage)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => void navigate(`/products/${encodeURIComponent(item.id)}`)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface-subtle px-3 py-1 text-xs transition-colors outline-none hover:border-foreground/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="max-w-[160px] truncate font-medium text-foreground">
                {item.title}
              </span>
              <ProductPrice
                value={item.price}
                className="font-semibold text-foreground tabular-nums"
              />
              {timeText && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                  <Clock aria-hidden="true" className="size-3" />
                  <span>{timeText}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
