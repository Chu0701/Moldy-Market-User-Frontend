import { useEffect } from 'react'
import { ArrowLeft, BadgeDollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { ProductPriceHistoryPanel } from '@/features/analytics/components/ProductPriceHistoryPanel'
import { useSession } from '@/features/auth/hooks/useSession'
import { MobileBuyBar } from '@/features/products/components/MobileBuyBar'
import { ProductDeleteButton } from '@/features/products/components/ProductDeleteButton'
import { ProductGallery } from '@/features/products/components/ProductGallery'
import { ProductInfo } from '@/features/products/components/ProductInfo'
import { ProductPurchaseBox } from '@/features/products/components/ProductPurchaseBox'
import { ProductVisibilityButton } from '@/features/products/components/ProductVisibilityButton'
import { RecentlyViewedSection } from '@/features/products/components/RecentlyViewedSection'
import { SimilarProductsSection } from '@/features/products/components/SimilarProductsSection'
import { useProductDetail } from '@/features/products/hooks/useProductDetail'
import { useProductManagementAccess } from '@/features/products/hooks/useProductManagementAccess'
import { recordRecentlyViewed } from '@/features/products/recentlyViewedStorage'
import { getProductMediaUrls } from '@/features/products/utils/productMedia'

export function ProductDetailPage() {
  const { t } = useTranslation()
  const query = useProductDetail()
  const { profileQuery } = useSession()
  const { canManage } = useProductManagementAccess(query.data, profileQuery.data)
  const loadedProduct = query.data

  useEffect(() => {
    if (
      !loadedProduct?.id ||
      loadedProduct.status === 'DELETED' ||
      loadedProduct.status === 'REMOVED'
    ) {
      return
    }
    recordRecentlyViewed({
      id: loadedProduct.id,
      title: loadedProduct.title,
      price: loadedProduct.price,
      imageUrl: getProductMediaUrls(loadedProduct)[0],
      condition: loadedProduct.condition,
      createdAt: loadedProduct.createdAt,
    })
  }, [loadedProduct])

  if (query.isPending) {
    return (
      <div role="status" className="product-detail-loading">
        <span>{t('products.loading')}</span>
        <div className="product-detail-image-skeleton skeleton-shimmer" aria-hidden="true" />
        <div className="product-detail-info-skeleton" aria-hidden="true">
          <div className="skeleton-shimmer" />
          <div className="skeleton-shimmer" />
          <div className="skeleton-shimmer" />
        </div>
      </div>
    )
  }

  if (query.isError && query.error.status !== 404) {
    return (
      <section className="product-detail-feedback">
        <h1>{t('products.detailTitle')}</h1>

        {query.error.status === 403 ? (
          <ForbiddenState />
        ) : (
          <ErrorState
            title={t('products.detail.errorTitle')}
            description={t('products.detail.errorMessage')}
            onRetry={() => query.refetch()}
            isRetrying={query.isFetching}
          />
        )}
      </section>
    )
  }

  const product = query.data

  if (
    query.error?.status === 404 ||
    !product ||
    product.status === 'DELETED' ||
    product.status === 'REMOVED'
  ) {
    return (
      <section className="product-detail-feedback">
        <h1>{t('products.detail.unavailableTitle')}</h1>
        <p>{t('products.detail.unavailableMessage')}</p>

        <Button asChild variant="outline">
          <Link to="/products">{t('products.detail.backToProducts')}</Link>
        </Button>
      </section>
    )
  }

  const manageActions = canManage ? (
    <div className="flex flex-wrap items-start gap-2.5 rounded-xl border border-border bg-card p-4">
      <Button asChild variant="outline">
        <Link
          to={`${product.storeId ? '/store/products' : '/my-products'}/${encodeURIComponent(product.id)}/edit`}
        >
          {t('products.edit.title')}
        </Link>
      </Button>
      {product.storeId && (
        <Button asChild variant="outline">
          <Link to="/store/offers">
            <BadgeDollarSign aria-hidden="true" className="size-4" />
            <span>{t('products.detail.viewReceivedOffers')}</span>
          </Link>
        </Button>
      )}
      <ProductVisibilityButton key={product.id} productId={product.id} status={product.status} />
      <ProductDeleteButton key={`delete-${product.id}`} productId={product.id} />
    </div>
  ) : null

  const showMobileBar = product.status === 'ACTIVE' && !canManage

  return (
    <div className={showMobileBar ? 'space-y-10 pb-20 md:pb-0' : 'space-y-10'}>
      <div className="space-y-6">
        <div>
          <Link
            to="/products"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            <span>{t('products.detail.backToProducts')}</span>
          </Link>
        </div>

        <article className="product-detail-page">
          <ProductGallery
            key={product.id}
            images={getProductMediaUrls(product)}
            title={product.title}
            onMediaError={() => query.refetch()}
          />

          <ProductInfo
            title={product.title}
            price={product.price}
            condition={product.condition}
            status={product.status}
            description={product.description}
            attributes={product.attributes}
            storeId={product.storeId}
            hideInlinePrice
            actions={<ProductPurchaseBox product={product} canManage={canManage} />}
            manageActions={manageActions}
            priceHistory={
              <ProductPriceHistoryPanel
                key={`price-history-${product.id}`}
                productId={product.id}
              />
            }
          />
        </article>
      </div>

      <SimilarProductsSection categoryId={product.categoryId} currentProductId={product.id} />
      <RecentlyViewedSection excludeProductId={product.id} />

      {showMobileBar && <MobileBuyBar price={product.price} product={product} />}
    </div>
  )
}
