import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useCart, useRemoveCartItem } from '@/features/cart/hooks/useCart'
import { productKeys } from '@/features/products/hooks/useProductSearch'
import { getProductById } from '@/services/products/productService'

function CartItemRow({ item }) {
  const { t } = useTranslation()
  const removal = useRemoveCartItem()
  const productQuery = useQuery({
    queryKey: productKeys.detail(item.listingId),
    queryFn: ({ signal }) => getProductById({ productId: item.listingId, signal }),
    retry: false,
  })

  const product = productQuery.data
  const unavailable =
    productQuery.error?.status === 403 ||
    productQuery.error?.status === 404 ||
    (product && product.status !== 'ACTIVE')

  return (
    <li className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:p-6">
      <div className="grid min-w-0 gap-2">
        {productQuery.isPending ? (
          <p role="status">{t('products.loading')}</p>
        ) : product && !unavailable ? (
          <Link
            to={`/products/${encodeURIComponent(item.listingId)}`}
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
          onClick={() => removal.mutate({ productId: item.listingId })}
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

export function CartPage() {
  const { t } = useTranslation()
  const query = useCart()

  if (query.isPending) return <p role="status">{t('cart.loading')}</p>
  if (query.error?.status === 403) return <ForbiddenState />

  if (query.isError) {
    return (
      <ErrorState
        title={t('cart.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  const cart = query.data
  const groups = new Map()

  for (const item of cart.items) {
    const group = groups.get(item.sellerId) ?? []
    group.push(item)
    groups.set(item.sellerId, group)
  }

  return (
    <section className="grid w-full max-w-4xl gap-6" aria-labelledby="cart-title">
      <h1 id="cart-title">{t('cart.title')}</h1>

      {cart.items.length === 0 ? (
        <EmptyState title={t('cart.emptyTitle')} description={t('cart.emptyDescription')} />
      ) : (
        <>
          {[...groups].map(([sellerId, items]) => (
            <ul
              key={sellerId}
              aria-label={t('cart.sellerGroup')}
              className="divide-y divide-border overflow-hidden rounded-xl border border-border"
            >
              {items.map((item) => (
                <CartItemRow key={item.listingId} item={item} />
              ))}
            </ul>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p>{t('cart.subtotal', { count: cart.totalItems })}</p>
            <ProductPrice value={cart.subtotal} className="text-xl font-semibold" />
          </div>
        </>
      )}
    </section>
  )
}
