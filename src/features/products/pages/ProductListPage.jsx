import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { ProductGrid } from '@/features/marketplace/components/ProductGrid'
import { ProductSkeleton } from '@/features/marketplace/components/ProductSkeleton'
import { ProductCard } from '@/features/products/components/ProductCard'
import { ProductSearchForm } from '@/features/products/components/ProductSearchForm'
import { useProductSearch } from '@/features/products/hooks/useProductSearch'
import { PaginationBar } from '@/components/common/PaginationBar'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

export function ProductListPage() {
  const { t } = useTranslation()
  const { params, query, changePage } = useProductSearch()
  const products = query.data?.items ?? []

  let content

  if (query.isPending) {
    content = <ProductSkeleton />
  } else if (query.isError) {
    content =
      query.error.status === 403 ? (
        <ForbiddenState />
      ) : (
        <ErrorState
          title={t('products.search.errorTitle')}
          description={t('products.search.errorMessage')}
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      )
  } else if (products.length === 0) {
    content = (
      <div className="product-search-empty">
        <h2>{t('products.search.emptyTitle')}</h2>
        <p>{t('products.search.emptyMessage')}</p>
        <Button asChild variant="outline">
          <Link to="/products">{t('products.search.clear')}</Link>
        </Button>
      </div>
    )
  } else {
    content = (
      <ProductGrid>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            price={product.price}
            imageUrl={product.images?.[0]}
            conditionLabel={t(conditionKeys[product.condition] ?? 'products.conditions.unknown')}
          />
        ))}
      </ProductGrid>
    )
  }

  return (
    <section className="product-list-page">
      <h1>{t('navigation.products')}</h1>

      <ProductSearchForm params={params} />

      <div
        className="product-search-results"
        aria-busy={query.isFetching}
        data-stale={query.isPlaceholderData}
      >
        {content}
      </div>
      {query.isSuccess && (
        <PaginationBar
          page={query.data.page}
          hasNext={query.data.hasNext}
          totalElements={query.data.totalElements}
          totalCapped={query.data.totalCapped}
          disabled={query.isFetching}
          onPageChange={changePage}
        />
      )}
    </section>
  )
}
