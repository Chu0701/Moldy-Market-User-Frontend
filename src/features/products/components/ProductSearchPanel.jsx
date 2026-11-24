import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
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
import { cn } from '@/lib/utils'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

/** @param {{ storeId?: string, categoryId?: string }} props */
export function ProductSearchPanel({ storeId, categoryId }) {
  const { t } = useTranslation()
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const { params, query, changePage } = useProductSearch({ storeId, categoryId })
  const products = query.data?.items ?? []
  let action = '/products'

  if (storeId) {
    action = `/stores/${encodeURIComponent(storeId)}`
  } else if (categoryId) {
    action = `/categories/${encodeURIComponent(categoryId)}`
  }

  const EmptyHeading = storeId || categoryId ? 'h3' : 'h2'
  const hasFilter = Boolean(
    params.q ||
    (Array.isArray(params.categoryId) ? params.categoryId.length > 0 : params.categoryId) ||
    (Array.isArray(params.condition) ? params.condition.length > 0 : params.condition) ||
    params.minPrice !== undefined ||
    params.maxPrice !== undefined,
  )
  const emptyStore = Boolean(storeId) && !hasFilter && params.page === 1 && products.length === 0
  const resultCount =
    typeof query.data?.totalElements === 'number' ? query.data.totalElements : products.length

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
        <EmptyHeading>
          {t(emptyStore ? 'stores.emptyProducts' : 'products.search.emptyTitle')}
        </EmptyHeading>
        {!emptyStore && (
          <>
            <p>{t('products.search.emptyMessage')}</p>
            <Button asChild variant="outline">
              <Link to={action}>{t('products.search.clear')}</Link>
            </Button>
          </>
        )}
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
    <div className="product-discovery-layout">
      <aside className="product-discovery-sidebar">
        <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            aria-expanded={showMobileFilters}
            onClick={() => setShowMobileFilters((open) => !open)}
            className="min-h-11 gap-2"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            <span>
              {t(
                showMobileFilters ? 'products.filters.hideButton' : 'products.filters.toggleButton',
              )}
            </span>
          </Button>
        </div>

        <div className={cn(!showMobileFilters && 'hidden lg:block')}>
          <ProductSearchForm params={params} action={action} showCategoryFilter={!categoryId} />
        </div>
      </aside>

      <div className="product-discovery-content">
        {query.isSuccess && products.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p className="tabular-nums">
              {t('products.filters.resultCount', { count: resultCount })}
            </p>
            {hasFilter && (
              <Button asChild variant="ghost" size="sm" className="min-h-9 gap-1.5 text-foreground">
                <Link to={action}>
                  <X aria-hidden="true" className="size-3.5" />
                  <span>{t('products.search.clear')}</span>
                </Link>
              </Button>
            )}
          </div>
        )}

        <div
          className="product-search-results"
          aria-busy={query.isFetching}
          data-stale={query.isPlaceholderData}
        >
          {content}
        </div>

        {query.isSuccess && !emptyStore && (
          <PaginationBar
            page={query.data.page}
            hasNext={query.data.hasNext}
            totalElements={query.data.totalElements}
            totalCapped={query.data.totalCapped}
            disabled={query.isFetching}
            onPageChange={changePage}
          />
        )}
      </div>
    </div>
  )
}
