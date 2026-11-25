import { Heart, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { CompareToggleButton } from '@/features/products/components/CompareToggleButton'
import { cn } from '@/lib/utils'

const CONDITION_BADGE_TONES = {
  NEW: 'bg-emerald-50/95 text-emerald-800 ring-emerald-200/90',
  LIKE_NEW: 'bg-sky-50/95 text-sky-800 ring-sky-200/90',
  DAMAGED: 'bg-amber-50/95 text-amber-800 ring-amber-300/90',
}

function formatRelativeListingTime(isoValue, locale) {
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
 * Clean C2C square listing card with prominent price below title, color-coded condition badge,
 * escrow trust mark, optional wishlist heart & compare toggles, and relative listing timestamp.
 *
 * @param {{
 *   id: string,
 *   title: string,
 *   price: number,
 *   imageUrl?: string,
 *   condition?: string,
 *   conditionLabel: string,
 *   statusLabel?: string,
 *   createdAt?: string,
 *   isWishlisted?: boolean,
 *   wishlistPending?: boolean,
 *   onToggleWishlist?: () => void,
 *   compareProduct?: object,
 *   onImageError?: () => void,
 * }} props
 */
export function ProductCard({
  id,
  title,
  price,
  imageUrl,
  condition,
  conditionLabel,
  statusLabel,
  createdAt,
  isWishlisted = false,
  wishlistPending = false,
  onToggleWishlist,
  compareProduct,
  onImageError,
}) {
  const { t, i18n } = useTranslation()
  const relativeTime = formatRelativeListingTime(createdAt, i18n.resolvedLanguage)
  const topBadge = statusLabel || conditionLabel
  const badgeTone = !statusLabel
    ? (CONDITION_BADGE_TONES[condition] ?? 'bg-background/90 text-foreground ring-border/80')
    : 'bg-background/90 text-foreground ring-border/80'

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm motion-reduce:transform-none">
      <Link
        to={`/products/${id}`}
        className="flex min-w-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className="size-full transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
            onError={onImageError}
          />

          {topBadge && (
            <span
              className={cn(
                'absolute top-2 left-2 rounded-md px-2 py-0.5 text-[11px] leading-5 font-medium ring-1 backdrop-blur-[2px]',
                badgeTone,
              )}
            >
              {topBadge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <p className="line-clamp-2 min-h-10 text-sm leading-5 font-medium break-words text-foreground">
            {title}
          </p>

          <ProductPrice
            value={price}
            className="text-base leading-6 font-bold tracking-tight text-foreground tabular-nums"
          />

          <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
            {statusLabel ? (
              <span className="truncate rounded-sm border border-border bg-surface-subtle px-1.5 py-0.5 font-medium">
                {conditionLabel}
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-emerald-700/85"
              >
                <ShieldCheck className="size-3 shrink-0" />
                <span className="truncate">{t('products.escrowShort')}</span>
              </span>
            )}
            {relativeTime && (
              <time dateTime={createdAt} className="shrink-0 tabular-nums">
                {relativeTime}
              </time>
            )}
          </div>
        </div>
      </Link>

      {(onToggleWishlist || compareProduct) && (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
          {onToggleWishlist && (
            <button
              type="button"
              onClick={onToggleWishlist}
              disabled={wishlistPending}
              aria-pressed={isWishlisted}
              aria-label={t(isWishlisted ? 'wishlist.savedAction' : 'wishlist.saveAction')}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground/80 shadow-xs backdrop-blur-[2px] transition-colors outline-none hover:bg-background hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
                isWishlisted && 'text-destructive',
              )}
            >
              <Heart
                aria-hidden="true"
                className="size-4"
                fill={isWishlisted ? 'currentColor' : 'none'}
              />
            </button>
          )}
          {compareProduct && <CompareToggleButton product={compareProduct} compact />}
        </div>
      )}
    </article>
  )
}
