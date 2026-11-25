import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { CategoryCard } from '@/features/marketplace/components/CategoryCard'
import { CategoryGrid } from '@/features/marketplace/components/CategoryGrid'
import { CategorySkeleton } from '@/features/marketplace/components/CategorySkeleton'
import { EscrowTrustSection } from '@/features/marketplace/components/EscrowTrustSection'
import { HeroSection } from '@/features/marketplace/components/HeroSection'
import { NewestProductsSection } from '@/features/marketplace/components/NewestProductsSection'
import { RecentListingsTicker } from '@/features/marketplace/components/RecentListingsTicker'
import { SellerCtaBanner } from '@/features/marketplace/components/SellerCtaBanner'
import { useCategories } from '@/features/marketplace/hooks/useCategories'
import { useNewestProducts } from '@/features/marketplace/hooks/useNewestProducts'
import { RecentlyViewedSection } from '@/features/products/components/RecentlyViewedSection'

export function HomePage() {
  const { t } = useTranslation()

  const { data: categories = [], isPending, isError, error, refetch, isFetching } = useCategories()
  const newestQuery = useNewestProducts()
  const newestItems = newestQuery.data?.items ?? []
  const totalProducts =
    typeof newestQuery.data?.totalElements === 'number'
      ? newestQuery.data.totalElements
      : newestItems.length

  let content

  if (isPending) {
    content = <CategorySkeleton />
  } else if (isError) {
    if (error.status === 403) {
      content = <ForbiddenState />
    } else {
      content = (
        <ErrorState
          title={t('categories.errorTitle')}
          description={t('categories.errorMessage')}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )
    }
  } else if (categories.length === 0) {
    content = (
      <EmptyState title={t('categories.emptyTitle')} description={t('categories.emptyMessage')} />
    )
  } else {
    content = categories.map((category) => (
      <CategoryCard
        key={category.id}
        name={category.name}
        to={`/categories/${category.id}`}
        subCount={Array.isArray(category.children) ? category.children.length : 0}
      />
    ))
  }

  return (
    <>
      <HeroSection newestProducts={newestItems} totalProducts={totalProducts} />
      <RecentListingsTicker products={newestItems} />
      <CategoryGrid>{content}</CategoryGrid>
      <NewestProductsSection query={newestQuery} />
      <RecentlyViewedSection />
      <EscrowTrustSection />
      <SellerCtaBanner />
    </>
  )
}
