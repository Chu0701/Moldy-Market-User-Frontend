import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { FeaturedProducts } from '@/features/marketplace/components/FeaturedProducts'
import { ProductSkeleton } from '@/features/marketplace/components/ProductSkeleton'
import { useNewestProducts } from '@/features/marketplace/hooks/useNewestProducts'
import { ProductCard } from '@/features/products/components/ProductCard'

const conditionKeys = {
  NEW: 'products.conditions.new',
  LIKE_NEW: 'products.conditions.likeNew',
  USED: 'products.conditions.used',
  DAMAGED: 'products.conditions.damaged',
}

export function NewestProductsSection() {
  const { t } = useTranslation()
  const query = useNewestProducts()
  const products = query.data?.items ?? []

  let content

  if (query.isPending) {
    content = <ProductSkeleton />
  } else if (query.isError) {
    if (query.error.status === 403) {
      content = <ForbiddenState />
    } else {
      content = (
        <ErrorState
          title={t('products.errorTitle')}
          description={t('products.errorMessage')}
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      )
    }
  } else if (products.length === 0) {
    return null
  } else {
    content = products.map((product) => (
      <ProductCard
        key={product.id}
        id={product.id}
        title={product.title}
        price={product.price}
        imageUrl={product.images?.[0]}
        conditionLabel={t(conditionKeys[product.condition] ?? 'products.conditions.unknown')}
      />
    ))
  }

  return <FeaturedProducts>{content}</FeaturedProducts>
}
