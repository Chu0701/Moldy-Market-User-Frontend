import { useTranslation } from 'react-i18next'
import { Link, useInRouterContext } from 'react-router'

import { ImageWithFallback } from '@/components/common/ImageWithFallback'
import { ProductPrice } from '@/components/common/ProductPrice'

/** @param {{ items: Array<object>, maxVisible?: number, linkProducts?: boolean }} props */
export function OrderItems({ items = [], maxVisible, linkProducts = false }) {
  const { t } = useTranslation()
  const inRouter = useInRouterContext()
  const visibleItems =
    typeof maxVisible === 'number' && maxVisible > 0 ? items.slice(0, maxVisible) : items
  const hiddenCount = items.length - visibleItems.length

  return (
    <div className="grid gap-3">
      <ul className="order-items" aria-label={t('orders.products')}>
        {visibleItems.map((item) => {
          const productId = item.productId ?? item.listingId
          const canLink = linkProducts && inRouter && Boolean(productId)
          const productHref = productId ? `/products/${encodeURIComponent(productId)}` : null

          return (
            <li key={item.id} className="order-item">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {canLink ? (
                  <Link
                    to={productHref}
                    aria-hidden="true"
                    tabIndex={-1}
                    className="block size-full"
                  >
                    <ImageWithFallback src={item.imageUrl} alt="" compact className="size-full" />
                  </Link>
                ) : (
                  <ImageWithFallback src={item.imageUrl} alt="" compact className="size-full" />
                )}
              </div>

              <div className="grid min-w-0 flex-1 gap-1">
                {canLink ? (
                  <Link
                    to={productHref}
                    className="line-clamp-2 text-sm font-medium break-words text-foreground underline-offset-4 hover:underline"
                  >
                    {item.productName}
                  </Link>
                ) : (
                  <p className="line-clamp-2 text-sm font-medium break-words text-foreground">
                    {item.productName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('orders.quantity', { count: item.quantity })} · {t('orders.unitPrice')}{' '}
                  <ProductPrice value={item.unitPrice} className="font-medium text-foreground" />
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      {hiddenCount > 0 && (
        <p className="text-xs font-medium text-muted-foreground">
          {t('orders.moreItems', { count: hiddenCount })}
        </p>
      )}
    </div>
  )
}
