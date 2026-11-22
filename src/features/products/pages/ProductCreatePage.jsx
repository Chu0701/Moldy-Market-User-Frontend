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
import { getStoreContext } from '@/features/stores/getStoreContext'
import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
import { useMyStaffProfile } from '@/features/stores/hooks/useMyStaffProfile'

export function ProductCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profileQuery } = useSession()
  const profile = profileQuery.data
  const staffQuery = useMyStaffProfile(
    getStoreContext(profile).kind === 'staff' ? profile?.id : undefined,
  )
  const storeContext = getStoreContext(profile, staffQuery.isError ? undefined : staffQuery.data)
  const isStaff = storeContext.kind === 'staff'
  const staffStoreId = isStaff && storeContext.canCreateProduct ? storeContext.storeId : undefined
  const ownedStoreQuery = useMyStore(isStaff ? undefined : profile?.id)
  const linkedStoreQuery = usePublicStore(staffStoreId)
  const storeQuery = isStaff ? linkedStoreQuery : ownedStoreQuery
  const store = storeQuery.data
  const { query, groups } = useProductCategoryOptions()
  const isForbidden =
    !profile?.id ||
    (isStaff && !staffStoreId) ||
    store?.status === 'BLOCKED' ||
    storeQuery.error?.status === 403

  function handleCreated(product) {
    void queryClient.invalidateQueries({ queryKey: ['products', 'search'] })
    void queryClient.invalidateQueries({ queryKey: ['products', 'store-mine'] })
    void navigate(`/products/${encodeURIComponent(product.id)}`, { replace: true })
  }

  if (isStaff && staffQuery.isPending) return <p role="status">{t('stores.loading')}</p>
  if (isStaff && staffQuery.isError && ![403, 404].includes(staffQuery.error?.status))
    return (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void staffQuery.refetch()}
        isRetrying={staffQuery.isFetching}
      />
    )

  return (
    <section className="profile-page" aria-labelledby="product-create-heading">
      <h1 id="product-create-heading">{t('products.create.pageTitle')}</h1>

      {isForbidden ? (
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
      ) : !store && isStaff ? (
        <p role="alert">{t('stores.unavailableTitle')}</p>
      ) : !store ? (
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
