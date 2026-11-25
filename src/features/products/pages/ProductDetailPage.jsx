import { useEffect } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { MobileBuyBar } from '@/features/products/components/MobileBuyBar'
import { ProductGallery } from '@/features/products/components/ProductGallery'
import { ProductInfo } from '@/features/products/components/ProductInfo'
import { RecentlyViewedSection } from '@/features/products/components/RecentlyViewedSection'
import { SimilarProductsSection } from '@/features/products/components/SimilarProductsSection'
import { recordRecentlyViewed } from '@/features/products/recentlyViewedStorage'
import { useSession } from '@/features/auth/hooks/useSession'
import { ProductVisibilityButton } from '@/features/products/components/ProductVisibilityButton'
import { ProductDeleteButton } from '@/features/products/components/ProductDeleteButton'
import { useProductDetail } from '@/features/products/hooks/useProductDetail'
import { useProductManagementAccess } from '@/features/products/hooks/useProductManagementAccess'
import { AddToCartButton } from '@/features/cart/components/AddToCartButton'
import { BuyNowButton } from '@/features/cart/components/BuyNowButton'
import { StoreChatButton } from '@/features/chat/components/StoreChatButton'
import { CompareToggleButton } from '@/features/products/components/CompareToggleButton'
import { WishlistButton } from '@/features/wishlist/components/WishlistButton'
import { ProductPriceHistoryPanel } from '@/features/analytics/components/ProductPriceHistoryPanel'

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
      imageUrl: loadedProduct.images?.[0],
      condition: loadedProduct.condition,
      createdAt: loadedProduct.createdAt,
    })
  }, [
    loadedProduct?.id,
    loadedProduct?.title,
    loadedProduct?.price,
    loadedProduct?.images,
    loadedProduct?.condition,
    loadedProduct?.createdAt,
    loadedProduct?.status,
  ])

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

  const buyerActions = (
    <div
      id="product-purchase-box"
      className="space-y-4 rounded-lg border border-border bg-surface-subtle p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start gap-2.5">
        <BuyNowButton key={`buy-${product.id}`} product={product} />
        <AddToCartButton key={product.id} product={product} variant="outline" />
        <WishlistButton key={`wishlist-${product.id}`} productId={product.id} />
        {product.storeId && (
          <StoreChatButton
            key={`chat-${product.id}`}
            storeId={product.storeId}
            product={{
              id: product.id,
              title: product.title,
              price: product.price,
              imageUrl: product.images?.[0],
            }}
          />
        )}
        <CompareToggleButton
          product={{
            id: product.id,
            title: product.title,
            price: product.price,
            imageUrl: product.images?.[0],
            condition: product.condition,
            status: product.status,
            storeId: product.storeId,
            attributes: product.attributes,
          }}
        />
      </div>
      <div className="flex items-start gap-2.5 border-t border-border pt-3.5 text-xs leading-5 text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
        <div>
          <p className="font-semibold text-foreground">{t('products.detail.protectionTitle')}</p>
          <p>{t('products.detail.protectionDesc')}</p>
        </div>
      </div>
    </div>
  )

  const manageActions = canManage ? (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-border bg-card p-4">
      <Button asChild variant="outline">
        <Link
          to={`${product.storeId ? '/store/products' : '/my-products'}/${encodeURIComponent(product.id)}/edit`}
        >
          {t('products.edit.title')}
        </Link>
      </Button>
      <ProductVisibilityButton key={product.id} productId={product.id} status={product.status} />
      <ProductDeleteButton key={`delete-${product.id}`} productId={product.id} />
    </div>
  ) : null

  const showMobileBar = product.status === 'ACTIVE'

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
          <ProductGallery key={product.id} images={product.images ?? []} title={product.title} />

          <ProductInfo
            title={product.title}
            price={product.price}
            condition={product.condition}
            status={product.status}
            description={product.description}
            attributes={product.attributes}
            storeId={product.storeId}
            actions={buyerActions}
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

      {showMobileBar && <MobileBuyBar price={product.price} />}
    </div>
  )
}
