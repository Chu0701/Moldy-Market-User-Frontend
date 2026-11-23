import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { ProductGallery } from '@/features/products/components/ProductGallery'
import { ProductInfo } from '@/features/products/components/ProductInfo'
import { useSession } from '@/features/auth/hooks/useSession'
import { ProductVisibilityButton } from '@/features/products/components/ProductVisibilityButton'
import { ProductDeleteButton } from '@/features/products/components/ProductDeleteButton'
import { useProductDetail } from '@/features/products/hooks/useProductDetail'
import { useProductManagementAccess } from '@/features/products/hooks/useProductManagementAccess'
import { AddToCartButton } from '@/features/cart/components/AddToCartButton'
import { StoreChatButton } from '@/features/chat/components/StoreChatButton'
import { WishlistButton } from '@/features/wishlist/components/WishlistButton'
import { ProductPriceHistoryPanel } from '@/features/analytics/components/ProductPriceHistoryPanel'

export function ProductDetailPage() {
  const { t } = useTranslation()
  const query = useProductDetail()
  const { profileQuery } = useSession()
  const { canManage } = useProductManagementAccess(query.data, profileQuery.data)

  if (query.isPending) {
    return (
      <div role="status" className="product-detail-loading">
        <span>{t('products.loading')}</span>
        <div className="product-detail-image-skeleton" aria-hidden="true" />
        <div className="product-detail-info-skeleton" aria-hidden="true">
          <div />
          <div />
          <div />
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

  return (
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
      />

      <div className="flex flex-wrap items-start gap-3 md:col-start-2">
        <AddToCartButton key={product.id} product={product} />
        <WishlistButton key={`wishlist-${product.id}`} productId={product.id} />
        {product.storeId && (
          <StoreChatButton key={`chat-${product.id}`} storeId={product.storeId} />
        )}
      </div>
      <ProductPriceHistoryPanel key={`price-history-${product.id}`} productId={product.id} />
      {canManage && (
        <div className="flex flex-wrap items-start gap-3 md:col-start-2">
          <Button asChild variant="outline">
            <Link
              to={`${product.storeId ? '/store/products' : '/my-products'}/${encodeURIComponent(product.id)}/edit`}
            >
              {t('products.edit.title')}
            </Link>
          </Button>
          <ProductVisibilityButton
            key={product.id}
            productId={product.id}
            status={product.status}
          />
          <ProductDeleteButton key={`delete-${product.id}`} productId={product.id} />
        </div>
      )}
    </article>
  )
}
