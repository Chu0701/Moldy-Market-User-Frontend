import { ShieldCheck, ShoppingBag, Store, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ProductPrice } from '@/components/common/ProductPrice'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { CartItemRow } from '@/features/cart/components/CartItemRow'
import { useCart, useRemoveCartItem } from '@/features/cart/hooks/useCart'
import { useCartProducts } from '@/features/cart/hooks/useCartProducts'
import { useAcceptedOffersMap } from '@/features/offers/hooks/useOffers'

const MAX_CHECKOUT_SELECTION = 20

function CartSkeleton({ label }) {
  return (
    <section className="cart-page" role="status">
      <span className="sr-only">{label}</span>
      <div className="skeleton-shimmer h-9 w-44 rounded-md" aria-hidden="true" />
      <div className="cart-layout" aria-hidden="true">
        <div className="kn-table-card divide-y divide-border">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="grid grid-cols-[1.5rem_5rem_minmax(0,1fr)] items-start gap-4 p-5"
            >
              <div className="skeleton-shimmer mt-3 size-4.5 rounded-sm" />
              <div className="skeleton-shimmer aspect-square w-full rounded-lg" />
              <div className="grid gap-2">
                <div className="skeleton-shimmer h-4 w-3/4 rounded-sm" />
                <div className="skeleton-shimmer h-3.5 w-24 rounded-sm" />
                <div className="skeleton-shimmer h-5 w-28 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
        <div className="cart-selection-panel">
          <div className="skeleton-shimmer h-5 w-36 rounded-sm" />
          <div className="skeleton-shimmer h-4 w-full rounded-sm" />
          <div className="skeleton-shimmer h-8 w-32 rounded-sm" />
          <div className="skeleton-shimmer h-11 w-full rounded-lg" />
        </div>
      </div>
    </section>
  )
}

export function CartPage() {
  const { t } = useTranslation()
  const query = useCart()
  const bulkRemoval = useRemoveCartItem()
  const [selectedIds, setSelectedIds] = useState([])
  const [cleaningUnavailable, setCleaningUnavailable] = useState(false)
  const items = query.data?.items ?? []
  const productQueries = useCartProducts(items)
  const { offersByProductId } = useAcceptedOffersMap()

  const availableItems = items.filter(
    (_, index) =>
      productQueries[index].isSuccess && productQueries[index].data?.status === 'ACTIVE',
  )
  const unavailableItems = items.filter((_, index) => {
    const pq = productQueries[index]
    return (
      pq.error?.status === 403 ||
      pq.error?.status === 404 ||
      (pq.data && pq.data.status !== 'ACTIVE')
    )
  })
  const selectedItems = availableItems.filter((item) => selectedIds.includes(item.listingId))
  const selectedTotal = selectedItems.reduce((total, item) => {
    const accepted = offersByProductId.get(item.listingId)
    return total + Number(accepted ? accepted.price : item.totalPrice)
  }, 0)
  const selectedSellerCount = new Set(selectedItems.map((item) => item.sellerId)).size
  const atLimit = selectedItems.length >= MAX_CHECKOUT_SELECTION
  const checkoutParams = new URLSearchParams()
  selectedItems.forEach((item) => checkoutParams.append('productId', item.listingId))

  function toggleItem(productId) {
    const currentIds = selectedItems.map((item) => item.listingId)
    setSelectedIds(
      currentIds.includes(productId)
        ? currentIds.filter((id) => id !== productId)
        : [...currentIds, productId].slice(0, MAX_CHECKOUT_SELECTION),
    )
  }

  function toggleSellerGroup(groupAvailableIds) {
    const currentIds = selectedItems.map((item) => item.listingId)
    const allGroupSelected =
      groupAvailableIds.length > 0 && groupAvailableIds.every((id) => currentIds.includes(id))
    if (allGroupSelected) {
      setSelectedIds(currentIds.filter((id) => !groupAvailableIds.includes(id)))
      return
    }
    const next = [...currentIds]
    for (const id of groupAvailableIds) {
      if (next.length >= MAX_CHECKOUT_SELECTION) break
      if (!next.includes(id)) next.push(id)
    }
    setSelectedIds(next)
  }

  async function removeUnavailableItems() {
    if (cleaningUnavailable || unavailableItems.length === 0) return
    setCleaningUnavailable(true)
    try {
      await Promise.allSettled(
        unavailableItems.map((item) => bulkRemoval.mutateAsync({ productId: item.listingId })),
      )
      setSelectedIds((ids) =>
        ids.filter((id) => !unavailableItems.some((item) => item.listingId === id)),
      )
    } finally {
      setCleaningUnavailable(false)
    }
  }

  if (query.isPending) return <CartSkeleton label={t('cart.loading')} />
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
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 id="cart-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('cart.title')}
        </h1>
        {items.length > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {t('table.rowsCount', { count: items.length })}
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <div className="grid justify-items-start gap-4">
          <EmptyState
            icon={ShoppingBag}
            title={t('cart.emptyTitle')}
            description={t('cart.emptyDescription')}
            className="w-full"
          />
          <Button asChild>
            <Link to="/products">{t('orders.browseProducts')}</Link>
          </Button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="grid min-w-0 gap-4">
            <div className="cart-selection-controls">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={availableItems.length === 0}
                  onClick={() =>
                    setSelectedIds(
                      availableItems.slice(0, MAX_CHECKOUT_SELECTION).map((item) => item.listingId),
                    )
                  }
                >
                  {t('cart.selectAll')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={selectedItems.length === 0}
                  onClick={() => setSelectedIds([])}
                >
                  {t('cart.clearSelection')}
                </Button>
                {unavailableItems.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={cleaningUnavailable}
                    onClick={() => void removeUnavailableItems()}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    <span>{t('cart.removeUnavailable', { count: unavailableItems.length })}</span>
                  </Button>
                )}
              </div>

              <span
                className={
                  atLimit
                    ? 'rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning tabular-nums'
                    : 'text-xs text-muted-foreground tabular-nums'
                }
              >
                {selectedItems.length}/{MAX_CHECKOUT_SELECTION}
              </span>
            </div>

            {atLimit && (
              <p
                role="status"
                className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs font-medium text-warning"
              >
                {t('cart.selectionLimit')}
              </p>
            )}

            {[...groups].map(([sellerId, rows], groupIndex) => {
              const groupAvailableIds = rows
                .filter(
                  ({ productQuery }) =>
                    productQuery.isSuccess && productQuery.data?.status === 'ACTIVE',
                )
                .map(({ item }) => item.listingId)
              const allGroupSelected =
                groupAvailableIds.length > 0 &&
                groupAvailableIds.every((id) => selectedIds.includes(id))
              const canSelectGroup = groupAvailableIds.length > 0 && (allGroupSelected || !atLimit)
              const storeId = rows.find(({ productQuery }) => productQuery.data?.storeId)
                ?.productQuery.data?.storeId

              return (
                <div key={sellerId} className="kn-table-card">
                  <div className="kn-table-toolbar bg-surface-subtle/60 py-2.5">
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-foreground">
                        <input
                          type="checkbox"
                          checked={allGroupSelected}
                          disabled={!canSelectGroup}
                          onChange={() => toggleSellerGroup(groupAvailableIds)}
                          className="size-4 accent-primary disabled:cursor-not-allowed"
                          aria-label={t('cart.selectSellerGroup', { number: groupIndex + 1 })}
                        />
                        <Store className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span>{t('cart.sellerGroupTitle', { number: groupIndex + 1 })}</span>
                      </label>
                      {storeId && (
                        <Link
                          to={`/stores/${encodeURIComponent(storeId)}`}
                          className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          {t('cart.visitStore')}
                        </Link>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {t('table.rowsCount', { count: rows.length })}
                    </span>
                  </div>

                  <ul aria-label={t('cart.sellerGroup')} className="divide-y divide-border">
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
                          acceptedOffer={offersByProductId.get(item.listingId) ?? null}
                          selected={selected}
                          canSelect={available && (selected || !atLimit)}
                          onToggle={() => toggleItem(item.listingId)}
                          onRemoved={() =>
                            setSelectedIds((ids) => ids.filter((id) => id !== item.listingId))
                          }
                        />
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>

          <aside className="cart-selection-panel" aria-label={t('cart.summaryTitle')}>
            <h2 className="font-sans text-base font-semibold tracking-tight">
              {t('cart.summaryTitle')}
            </h2>

            <div className="grid gap-2.5 border-b border-border pb-4 text-sm">
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <p>{t('cart.subtotal', { count: query.data.totalItems })}</p>
                <ProductPrice
                  value={query.data.subtotal}
                  className="font-medium text-foreground tabular-nums"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p role="status" className="font-medium text-foreground">
                  {t('cart.selectedCount', { count: selectedItems.length })}
                </p>
                <ProductPrice
                  value={selectedTotal}
                  className="text-xl font-semibold tracking-tight text-foreground tabular-nums"
                />
              </div>
              {selectedSellerCount > 1 && (
                <p className="rounded-lg border border-border bg-surface-subtle px-3 py-2 text-xs text-muted-foreground">
                  {t('cart.splitOrdersNotice', { count: selectedSellerCount })}
                </p>
              )}
            </div>

            {selectedItems.length > 0 ? (
              <Button asChild className="min-h-11 w-full">
                <Link to={'/checkout?' + checkoutParams.toString()}>{t('cart.continue')}</Link>
              </Button>
            ) : (
              <div className="grid gap-1.5">
                <Button disabled className="min-h-11 w-full">
                  {t('cart.continue')}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {t('cart.selectAtLeastOne')}
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-subtle px-3.5 py-2.5 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden="true" />
              <span>{t('cart.escrowGuarantee')}</span>
            </div>

            <p className="text-[11px] leading-4 text-muted-foreground">{t('checkout.priceHint')}</p>
          </aside>
        </div>
      )}
    </section>
  )
}
