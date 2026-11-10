import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { CategoryCard } from '@/features/marketplace/components/CategoryCard'
import { CategoryGrid } from '@/features/marketplace/components/CategoryGrid'
import { CategorySkeleton } from '@/features/marketplace/components/CategorySkeleton'
import { HeroSection } from '@/features/marketplace/components/HeroSection'
import { useCategories } from '@/features/marketplace/hooks/useCategories'

export function HomePage() {
  const { t } = useTranslation()

  const { data: categories = [], isPending, isError, error, refetch, isFetching } = useCategories()

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
      <CategoryCard key={category.id} name={category.name} to={`/categories/${category.id}`} />
    ))
  }

  return (
    <>
      <HeroSection />
      <CategoryGrid>{content}</CategoryGrid>
    </>
  )
}
