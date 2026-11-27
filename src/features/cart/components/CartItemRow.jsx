import { Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { useRemoveCartItem } from '@/features/cart/hooks/useCart'
import { OfferCountdown } from '@/features/offers/components/OfferCountdown'
import { cn } from '@/lib/utils'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

export function CartItemRow({
  item,
  productQuery,
  acceptedOffer = null,
  selected,
  canSelect,
  onToggle,
  onRemoved,
}) {
  const { t } = useTranslation()
  const removal = useRemoveCartItem()
  const product = productQuery.data
  const isSold = product?.status === 'SOLD'
  const isHidden = product?.status === 'HIDDEN'
  const unavailable =
    productQuery.error?.status === 403 ||
    productQuery.error?.status === 404 ||
    (product && product.status !== 'ACTIVE')
  const selectionLabel = t('cart.selectItem', {
    title: product?.title ?? t('cart.unavailable'),
  })

  const itemPrice = Number(item.totalPrice)
  const latestPrice = product?.price != null ? Number(product.price) : null
  const priceChanged =
    !unavailable &&
    latestPrice != null &&
    !Number.isNaN(latestPrice) &&
    !Number.isNaN(itemPrice) &&
    latestPrice !== itemPrice
  const priceDropped = priceChanged && latestPrice < itemPrice
  const productPath = '/products/' + encodeURIComponent(item.listingId)
  const thumbnailUrl = getProductMediaUrls(product)[0]

  return (
    <li className={cn('cart-item-row', unavailable && 'bg-surface-subtle/50 opacity-65')}>
      <label className="cart-item-select">
        <input
          type="checkbox"
          checked={selected}
          disabled={!canSelect || removal.isPending}
          onChange={onToggle}
        />
        <span className="sr-only">{selectionLabel}</span>
      </label>

      {productQuery.isPending ? (
        <div className="skeleton-shimmer aspect-square w-full rounded-lg" aria-hidden="true" />
      ) : product && !unavailable ? (
        <Link
          to={productPath}
          aria-hidden="true"
          tabIndex={-1}
          className="block aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted"
        >
          <ImageWithFallback
            src={thumbnailUrl}
            alt=""
            compact
            className="size-full object-cover transition-transform duration-200 hover:scale-[1.03] motion-reduce:transform-none"
          />
        </Link>
      ) : (
        <div
          aria-hidden="true"
          className="aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted"
        >
          <ImageWithFallback
            src={thumbnailUrl}
            alt=""
            compact
            className="size-full object-cover grayscale"
          />
        </div>
      )}

      <div className="grid min-w-0 gap-1.5">
        {productQuery.isPending ? (
          <div role="status" className="grid gap-2">
            <span className="sr-only">{t('products.loading')}</span>
            <div className="skeleton-shimmer h-4 w-3/4 rounded-sm" aria-hidden="true" />
            <div className="skeleton-shimmer h-3.5 w-1/3 rounded-sm" aria-hidden="true" />
          </div>
        ) : product && !unavailable ? (
          <Link
            to={productPath}
            className="line-clamp-2 text-sm leading-5 font-medium break-words text-foreground underline-offset-4 hover:underline sm:text-[15px]"
          >
            {product.title}
          </Link>
        ) : (
          <div className="grid gap-1">
            {product?.title && (
              <p className="line-clamp-1 text-sm font-medium text-muted-foreground line-through">
                {product.title}
              </p>
            )}
            <p className="text-xs font-medium text-muted-foreground">
              {isSold
                ? t('cart.statusSold')
                : isHidden
                  ? t('cart.statusHidden')
                  : t('cart.unavailable')}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {product?.condition && !unavailable && (
            <span className="inline-flex items-center rounded-sm border border-border bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t(conditionKeys[product.condition] ?? 'products.conditions.unknown')}
            </span>
          )}
          {isSold && (
            <span className="inline-flex items-center rounded-sm border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t('products.statuses.sold')}
            </span>
          )}
          {isHidden && (
            <span className="inline-flex items-center rounded-sm border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t('products.statuses.hidden')}
            </span>
          )}
          {priceChanged && (
            <span
              className={cn(
                'inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium',
                priceDropped
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-warning/30 bg-warning/10 text-warning',
              )}
            >
              {t(priceDropped ? 'cart.priceDropped' : 'cart.priceIncreased')}
            </span>
          )}
          {acceptedOffer && !unavailable && (
            <span className="offer-agreed-pill">{t('offers.checkout.agreedPriceBadge')}</span>
          )}
        </div>

        {productQuery.isError && !unavailable && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={productQuery.isFetching}
              onClick={() => void productQuery.refetch()}
            >
              {t('actions.retry')}
            </Button>
          </div>
        )}

        {acceptedOffer && !unavailable ? (
          <div className="mt-0.5 space-y-1">
            <div className="offer-price-pair">
              <ProductPrice
                value={acceptedOffer.price}
                className="text-base font-semibold tracking-tight text-success tabular-nums"
              />
              <ProductPrice value={item.totalPrice} className="offer-price-original" />
            </div>
            <OfferCountdown
              targetIso={acceptedOffer.acceptedExpiresAt}
              prefix={t('offers.countdown.remaining')}
            />
          </div>
        ) : (
          <ProductPrice
            value={item.totalPrice}
            className="mt-0.5 text-base font-semibold tracking-tight tabular-nums"
          />
        )}
        {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
        {removal.error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {t('cart.removeError')}
          </p>
        )}
      </div>

      <div className="flex items-start justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={removal.isPending}
          aria-label={t(removal.isPending ? 'cart.removing' : 'cart.remove')}
          title={t(removal.isPending ? 'cart.removing' : 'cart.remove')}
          onClick={() => removal.mutate({ productId: item.listingId }, { onSuccess: onRemoved })}
          className="rounded-full text-muted-foreground hover:text-destructive"
        >
          {removal.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </li>
  )
}
