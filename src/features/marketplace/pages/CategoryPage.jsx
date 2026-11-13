import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useCategoryDetail } from '@/features/marketplace/hooks/useCategories'
import { ProductSearchPanel } from '@/features/products/components/ProductSearchPanel'

export function CategoryPage() {
  const { t } = useTranslation()
  const { categoryId } = useParams()
  const query = useCategoryDetail(categoryId)

  if (query.isPending) {
    return <p role="status">{t('categories.loading')}</p>
  }

  if (query.isError && query.error?.status !== 404) {
    return (
      <section className="category-page category-page-feedback">
        <h1>{t('categories.pageTitle')}</h1>
        {query.error?.status === 403 ? (
          <ForbiddenState />
        ) : (
          <ErrorState
            title={t('categories.errorTitle')}
            description={t('categories.errorMessage')}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        )}
      </section>
    )
  }

  const category = query.data

  if (query.isError || !category) {
    return (
      <section className="category-page category-page-feedback">
        <h1>{t('categories.notFoundTitle')}</h1>
        <Button asChild variant="outline">
          <Link to="/products">{t('navigation.products')}</Link>
        </Button>
      </section>
    )
  }

  const description = category.description?.trim()

  return (
    <section className="category-page">
      <header className="category-page-header">
        <h1>{category.name}</h1>
        {description && <p>{description}</p>}
      </header>

      <section className="category-page-products">
        <h2>{t('categories.productsTitle')}</h2>
        <ProductSearchPanel categoryId={categoryId} />
      </section>
    </section>
  )
}
