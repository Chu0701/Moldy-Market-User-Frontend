import { useTranslation } from 'react-i18next'

import { PaginationBar } from '@/components/common/PaginationBar'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { ProductGrid } from '@/features/marketplace/components/ProductGrid'
import { ProductSkeleton } from '@/features/marketplace/components/ProductSkeleton'
import { ProductCard } from '@/features/products/components/ProductCard'
import { useMyProducts } from '@/features/products/hooks/useMyProducts'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

export function MyProductsPage() {
  const { t } = useTranslation()
  const { query, changePage } = useMyProducts()
  const result = query.data

  let content
  if (query.isPending) {
    content = <ProductSkeleton />
  } else if (query.isError) {
    content =
      query.error?.status === 403 ? (
        <ForbiddenState />
      ) : (
        <ErrorState
          title={t('products.mine.loadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      )
  } else if (result.items.length === 0) {
    content = <p className="product-search-empty">{t('products.mine.empty')}</p>
  } else {
    content = (
      <ProductGrid>
        {result.items.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            price={product.price}
            imageUrl={product.images?.[0]}
            conditionLabel={t(conditionKeys[product.condition] ?? 'products.conditions.unknown')}
            statusLabel={t(
              product.status === 'HIDDEN' ? 'products.statuses.hidden' : 'products.statuses.active',
            )}
          />
        ))}
      </ProductGrid>
    )
  }

  return (
    <section className="product-list-page">
      <h1>{t('products.mine.title')}</h1>
      {content}

      {query.isSuccess && (result.page > 1 || result.hasNext) && (
        <PaginationBar
          page={result.page}
          hasNext={result.hasNext}
          totalElements={result.totalElements}
          disabled={query.isFetching}
          onPageChange={changePage}
        />
      )}
    </section>
  )
}
