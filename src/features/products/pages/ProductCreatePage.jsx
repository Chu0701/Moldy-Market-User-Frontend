import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ProductCreateForm } from '@/features/products/components/ProductCreateForm'
import { useProductCategoryOptions } from '@/features/products/hooks/useProductCategoryOptions'

export function ProductCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { query, groups } = useProductCategoryOptions()

  function handleCreated(product) {
    void queryClient.invalidateQueries({ queryKey: ['products', 'search'] })
    void navigate(`/products/${encodeURIComponent(product.id)}`, { replace: true })
  }

  return (
    <section className="profile-page" aria-labelledby="product-create-heading">
      <h1 id="product-create-heading">{t('products.create.pageTitle')}</h1>

      {query.isPending ? (
        <p role="status">{t('categories.loading')}</p>
      ) : query.isError ? (
        <ErrorState
          title={t('categories.errorTitle')}
          description={t('categories.errorMessage')}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      ) : groups.length === 0 ? (
        <EmptyState title={t('categories.emptyTitle')} description={t('categories.emptyMessage')} />
      ) : (
        <ProductCreateForm categoryGroups={groups} onCreated={handleCreated} />
      )}
    </section>
  )
}
