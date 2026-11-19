import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { CartItemRow } from '@/features/cart/components/CartItemRow'
import { useCart } from '@/features/cart/hooks/useCart'
import { useCartProducts } from '@/features/cart/hooks/useCartProducts'

export function CartPage() {
  const { t } = useTranslation()
  const query = useCart()
  const [selectedIds, setSelectedIds] = useState([])
  const items = query.data?.items ?? []
  const productQueries = useCartProducts(items)
  const availableItems = items.filter(
    (_, index) =>
      productQueries[index].isSuccess && productQueries[index].data?.status === 'ACTIVE',
  )
  const selectedItems = availableItems.filter((item) => selectedIds.includes(item.listingId))
  const selectedTotal = selectedItems.reduce((total, item) => total + Number(item.totalPrice), 0)
  const checkoutParams = new URLSearchParams()
  selectedItems.forEach((item) => checkoutParams.append('productId', item.listingId))

  function toggleItem(productId) {
    const currentIds = selectedItems.map((item) => item.listingId)
    setSelectedIds(
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId].slice(0, 20),
    )
  }

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

  const groups = new Map()
  items.forEach((item, index) => {
    const group = groups.get(item.sellerId) ?? []
    group.push({ item, productQuery: productQueries[index] })
    groups.set(item.sellerId, group)
  })

  return (
    <section className="cart-page" aria-labelledby="cart-title">
      <h1 id="cart-title">{t('cart.title')}</h1>

      {items.length === 0 ? (
        <EmptyState title={t('cart.emptyTitle')} description={t('cart.emptyDescription')} />
      ) : (
        <>
          <div className="cart-selection-controls">
            <Button
              type="button"
              variant="outline"
              disabled={availableItems.length === 0}
              onClick={() =>
                setSelectedIds(availableItems.slice(0, 20).map((item) => item.listingId))
              }
            >
              {t('cart.selectAll')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={selectedItems.length === 0}
              onClick={() => setSelectedIds([])}
            >
              {t('cart.clearSelection')}
            </Button>
            <p className="text-sm text-muted-foreground">{t('cart.selectionLimit')}</p>
          </div>

          {[...groups].map(([sellerId, rows]) => (
            <ul
              key={sellerId}
              aria-label={t('cart.sellerGroup')}
              className="divide-y divide-border overflow-hidden rounded-xl border border-border"
            >
              {rows.map(({ item, productQuery }) => {
                const selected = selectedItems.some(
                  (selectedItem) => selectedItem.listingId === item.listingId,
                )
                const available = availableItems.some(
                  (availableItem) => availableItem.listingId === item.listingId,
                )
                return (
                  <CartItemRow
                    key={item.listingId}
                    item={item}
                    productQuery={productQuery}
                    selected={selected}
                    canSelect={available && (selected || selectedItems.length < 20)}
                    onToggle={() => toggleItem(item.listingId)}
                    onRemoved={() =>
                      setSelectedIds((ids) => ids.filter((id) => id !== item.listingId))
                    }
                  />
                )
              })}
            </ul>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>{t('cart.subtotal', { count: query.data.totalItems })}</p>
            <ProductPrice value={query.data.subtotal} className="font-semibold" />
          </div>

          <div className="cart-selection-panel">
            <div className="grid gap-1">
              <p role="status">{t('cart.selectedCount', { count: selectedItems.length })}</p>
              <ProductPrice value={selectedTotal} className="text-xl font-semibold" />
              <p className="text-sm text-muted-foreground">{t('checkout.priceHint')}</p>
            </div>
            {selectedItems.length > 0 ? (
              <Button asChild>
                <Link to={'/checkout?' + checkoutParams.toString()}>{t('cart.continue')}</Link>
              </Button>
            ) : (
              <Button disabled>{t('cart.continue')}</Button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
