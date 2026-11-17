import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { ProductCreateForm } from '@/features/products/components/ProductCreateForm'
import { useProductCategoryOptions } from '@/features/products/hooks/useProductCategoryOptions'
import { useMyStore } from '@/features/stores/hooks/useMyStore'

export function ProductCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const storeQuery = useMyStore(profileQuery.data?.id)
  const store = storeQuery.data
  const { query, groups } = useProductCategoryOptions()

  function handleCreated(product) {
    void queryClient.invalidateQueries({ queryKey: ['products', 'search'] })
    void queryClient.invalidateQueries({ queryKey: ['products', 'store-mine'] })
    void navigate(`/products/${encodeURIComponent(product.id)}`, { replace: true })
  }

  return (
    <section className="profile-page" aria-labelledby="product-create-heading">
      <h1 id="product-create-heading">{t('products.create.pageTitle')}</h1>

      {!profileQuery.data?.id || store?.status === 'BLOCKED' || storeQuery.error?.status === 403 ? (
        <ForbiddenState />
      ) : storeQuery.isPending ? (
        <p role="status">{t('stores.loading')}</p>
      ) : storeQuery.isError ? (
        <ErrorState
          title={t('stores.loadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void storeQuery.refetch()}
          isRetrying={storeQuery.isFetching}
        />
      ) : store === null ? (
        <>
          <p>{t('products.create.storeRequired')}</p>
          <Button asChild>
            <Link to="/open-store">{t('stores.open.title')}</Link>
          </Button>
        </>
      ) : query.isPending ? (
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
        <ProductCreateForm
          key={store.id}
          storeId={store.id}
          categoryGroups={groups}
          onCreated={handleCreated}
        />
      )}
    </section>
  )
}
