import { Star, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { useStoreReviews } from '@/features/reviews/hooks/useReviews'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'

/** @param {{ storeId?: string | null }} props */
export function SellerCard({ storeId }) {
  const { t } = useTranslation()
  const query = usePublicStore(storeId)
  const reviewsQuery = useStoreReviews(storeId)

  if (!storeId) return null

  if (query.isPending) {
    return (
      <section className="product-seller">
        <h2>{t('products.seller.title')}</h2>
        <p role="status">{t('products.seller.loading')}</p>
      </section>
    )
  }

  if (query.isError) {
    const status = query.error?.status
    const unavailable = status === 403 || status === 404

    return (
      <section className="product-seller">
        <h2>{t('products.seller.title')}</h2>
        <p role="alert">
          {t(unavailable ? 'products.seller.unavailable' : 'products.seller.loadError')}
        </p>
        {!unavailable && (
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t('actions.retry')}
          </Button>
        )}
      </section>
    )
  }

  const store = query.data
  if (!store) return null

  const description = store.description?.trim()
  const initial = store.name?.trim().charAt(0).toUpperCase() || 'M'
  const reviewCount = reviewsQuery.isSuccess ? (reviewsQuery.data?.reviewCount ?? 0) : 0
  const averageRating = reviewsQuery.isSuccess ? (reviewsQuery.data?.averageRating ?? 0) : 0

  return (
    <section className="product-seller">
      <h2>{t('products.seller.title')}</h2>
      <div className="flex w-full items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-base font-semibold text-primary-foreground"
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="product-seller-name truncate">{store.name}</p>
          {reviewCount > 0 && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              <Star aria-hidden="true" className="size-3.5 fill-warning text-warning" />
              <span className="font-semibold text-foreground">
                {Number(averageRating).toFixed(1)}
              </span>
              <span>({t('reviews.countLabel', { count: reviewCount })})</span>
            </p>
          )}
        </div>
      </div>
      {description && <p>{description}</p>}
      <Button asChild variant="outline" className="min-h-10 gap-1.5 bg-background">
        <Link to={`/stores/${encodeURIComponent(storeId)}`}>
          <Store aria-hidden="true" className="size-4" />
          <span>{t('products.seller.viewStore')}</span>
        </Link>
      </Button>
    </section>
  )
}
