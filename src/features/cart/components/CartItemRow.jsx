import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { Button } from '@/components/ui/button'
import { useRemoveCartItem } from '@/features/cart/hooks/useCart'

export function CartItemRow({ item, productQuery, selected, canSelect, onToggle, onRemoved }) {
  const { t } = useTranslation()
  const removal = useRemoveCartItem()
  const product = productQuery.data
  const unavailable =
    productQuery.error?.status === 403 ||
    productQuery.error?.status === 404 ||
    (product && product.status !== 'ACTIVE')
  const selectionLabel = t('cart.selectItem', {
    title: product?.title ?? t('cart.unavailable'),
  })

  return (
    <li className="cart-item-row">
      <label className="cart-item-select">
        <input
          type="checkbox"
          checked={selected}
          disabled={!canSelect || removal.isPending}
          onChange={onToggle}
        />
        <span className="sr-only">{selectionLabel}</span>
      </label>

      <div className="grid min-w-0 gap-2">
        {productQuery.isPending ? (
          <p role="status">{t('products.loading')}</p>
        ) : product && !unavailable ? (
          <Link
            to={'/products/' + encodeURIComponent(item.listingId)}
            className="font-medium break-words underline-offset-4 hover:underline"
          >
            {product.title}
          </Link>
        ) : (
          <p>{t('cart.unavailable')}</p>
        )}

        {productQuery.isError && !unavailable && (
          <Button
            type="button"
            variant="outline"
            disabled={productQuery.isFetching}
            onClick={() => void productQuery.refetch()}
          >
            {t('actions.retry')}
          </Button>
        )}

        <ProductPrice value={item.totalPrice} className="font-semibold" />
        {item.note && <p className="text-sm text-muted-foreground">{item.note}</p>}
      </div>

      <div className="grid content-start justify-items-start gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={removal.isPending}
          onClick={() => removal.mutate({ productId: item.listingId }, { onSuccess: onRemoved })}
        >
          {t(removal.isPending ? 'cart.removing' : 'cart.remove')}
        </Button>
        {removal.error && (
          <p role="alert" className="text-sm text-destructive">
            {t('cart.removeError')}
          </p>
        )}
      </div>
    </li>
  )
}
