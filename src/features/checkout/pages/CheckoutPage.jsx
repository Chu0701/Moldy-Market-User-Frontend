import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartProducts } from '@/features/cart/hooks/useCartProducts'
import { CheckoutForm } from '@/features/checkout/components/CheckoutForm'

export function CheckoutPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const query = useCart()
  const requestedIds = params.getAll('productId')
  const validSelection =
    requestedIds.length > 0 &&
    requestedIds.length <= 20 &&
    new Set(requestedIds).size === requestedIds.length
  const selectedItems = validSelection
    ? (query.data?.items ?? []).filter((item) => requestedIds.includes(item.listingId))
    : []
  const productQueries = useCartProducts(selectedItems)

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

  const backLink = (
    <Link to="/cart" className="underline underline-offset-4">
      {t('checkout.backToCart')}
    </Link>
  )

  if (!validSelection || selectedItems.length !== requestedIds.length) {
    return (
      <section className="checkout-page">
        <h1>{t('checkout.title')}</h1>
        <EmptyState
          title={t('checkout.selectionTitle')}
          description={t('checkout.selectionDescription')}
        />
        {backLink}
      </section>
    )
  }

  if (productQueries.some((productQuery) => productQuery.isPending)) {
    return <p role="status">{t('checkout.checking')}</p>
  }

  if (
    productQueries.some(
      (productQuery) => productQuery.isError || productQuery.data?.status !== 'ACTIVE',
    )
  ) {
    return (
      <section className="checkout-page">
        <h1>{t('checkout.title')}</h1>
        <ErrorState
          title={t('checkout.unavailableProduct')}
          description={t('checkout.reviewCart')}
          onRetry={() => productQueries.forEach((productQuery) => void productQuery.refetch())}
          isRetrying={productQueries.some((productQuery) => productQuery.isFetching)}
        />
        {backLink}
      </section>
    )
  }

  const estimate = selectedItems.reduce((total, item) => total + Number(item.totalPrice), 0)

  return (
    <section className="checkout-page" aria-labelledby="checkout-title">
      <div className="grid gap-3">
        {backLink}
        <h1 id="checkout-title">{t('checkout.title')}</h1>
      </div>
      <div className="checkout-grid">
        <CheckoutForm />
        <aside className="checkout-panel" aria-labelledby="checkout-summary">
          <h2 id="checkout-summary">{t('checkout.summaryTitle')}</h2>
          <ul className="grid gap-4">
            {selectedItems.map((item, index) => (
              <li key={item.listingId} className="flex items-start justify-between gap-4">
                <Link
                  to={'/products/' + encodeURIComponent(item.listingId)}
                  className="min-w-0 break-words underline underline-offset-4"
                >
                  {productQueries[index].data.title}
                </Link>
                <ProductPrice value={item.totalPrice} className="shrink-0" />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p>{t('cart.selectedCount', { count: selectedItems.length })}</p>
            <ProductPrice value={estimate} className="text-xl font-semibold" />
          </div>
          <p className="text-sm text-muted-foreground">{t('checkout.priceHint')}</p>
        </aside>
      </div>
    </section>
  )
}
