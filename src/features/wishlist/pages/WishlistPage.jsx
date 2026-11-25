import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router'

import { PaginationBar } from '@/components/common/PaginationBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useToast } from '@/components/feedback/toastContext'
import { Button } from '@/components/ui/button'
import { useAddCartItem } from '@/features/cart/hooks/useCart'
import { WishlistCard } from '@/features/wishlist/components/WishlistCard'
import { useWishlistPage } from '@/features/wishlist/hooks/useWishlist'

function parsePage(raw) {
  const parsed = Number.parseInt(raw || '1', 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

export function WishlistPage() {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parsePage(searchParams.get('page'))
  const { profileQuery, listQuery, items, productQueries, removeMutation } = useWishlistPage({
    page,
    size: 20,
  })
  const addCartMutation = useAddCartItem()

  if (profileQuery.isPending || listQuery.isPending) {
    return (
      <section className="mx-auto max-w-5xl space-y-6" role="status" aria-busy="true">
        <span className="sr-only">{t('wishlist.loading')}</span>
        <div className="space-y-2">
          <div className="skeleton-shimmer h-8 w-48 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-72 rounded-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="skeleton-shimmer h-40 rounded-xl" />
          ))}
        </div>
      </section>
    )
  }

  if (listQuery.error?.status === 403) {
    return <ForbiddenState />
  }

  if (profileQuery.isError || listQuery.isError) {
    return (
      <ErrorState
        title={t('wishlist.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void listQuery.refetch()}
        isRetrying={listQuery.isFetching}
      />
    )
  }

  const data = listQuery.data

  function handleRemove(productId) {
    removeMutation.mutate(
      { productId },
      {
        onSuccess: () => pushToast(t('wishlist.removedToast'), 'info'),
        onError: () => pushToast(t('wishlist.removeError'), 'error'),
      },
    )
  }

  function handleAddToCart(productId) {
    addCartMutation.mutate(
      { productId },
      {
        onSuccess: () => pushToast(t('cart.added'), 'success'),
        onError: (err) =>
          pushToast(
            t(err?.code === 'CART_OWN_PRODUCT' ? 'cart.ownProduct' : 'cart.addError'),
            'error',
          ),
      },
    )
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6" aria-labelledby="wishlist-heading">
      <div>
        <h1
          id="wishlist-heading"
          className="scroll-mt-24 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {t('wishlist.title')}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('wishlist.description')}</p>
      </div>

      {removeMutation.isError && (
        <p role="alert" className="rounded-lg border border-border p-4 text-sm text-destructive">
          {t('wishlist.removeError')}
        </p>
      )}

      {items.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title={t('wishlist.emptyTitle')}
            description={t('wishlist.emptyDescription')}
          />
          <Button asChild variant="outline">
            <Link to="/products">{t('wishlist.browseProducts')}</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2" aria-label={t('wishlist.listLabel')}>
            {items.map((item, index) => {
              const productQuery = productQueries[index]
              return (
                <WishlistCard
                  key={item.id || item.productId}
                  item={item}
                  product={productQuery?.data}
                  isLoadingProduct={productQuery?.isPending}
                  isRemoving={
                    removeMutation.isPending &&
                    removeMutation.variables?.productId === item.productId
                  }
                  isAddingToCart={
                    addCartMutation.isPending &&
                    addCartMutation.variables?.productId === item.productId
                  }
                  onAddToCart={handleAddToCart}
                  onRemove={handleRemove}
                />
              )
            })}
          </ul>

          {data && (
            <PaginationBar
              page={data.page}
              hasNext={data.hasNext}
              totalElements={data.totalElements ?? items.length}
              disabled={listQuery.isFetching}
              onPageChange={(nextPage) => setSearchParams({ page: String(nextPage) })}
            />
          )}
        </>
      )}
    </section>
  )
}
