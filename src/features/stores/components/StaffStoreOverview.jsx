import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'
import { useMyStaffProfile } from '@/features/stores/hooks/useMyStaffProfile'
import { getStoreContext } from '@/features/stores/getStoreContext'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'

export function StaffStoreOverview({ profile }) {
  const { t } = useTranslation()
  const query = useMyStaffProfile(profile?.id)
  if (query.isPending) return <p role="status">{t('stores.loading')}</p>
  if ([403, 404].includes(query.error?.status)) return <ForbiddenState />
  if (query.isError)
    return (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  const context = getStoreContext(profile, query.data)
  if (!context.storeId) return <ForbiddenState />
  return <LinkedStaffStore {...context} />
}

function LinkedStaffStore({ storeId, canCreateProduct, canReadOrders, canManageProducts }) {
  const { t } = useTranslation()
  const query = usePublicStore(storeId)

  if (query.isPending) {
    return <p role="status">{t('stores.loading')}</p>
  }

  if (query.error?.status === 403 || query.error?.status === 404) {
    return <p role="alert">{t('stores.unavailableTitle')}</p>
  }

  if (query.isError) {
    return (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  }

  const store = query.data

  return (
    <section className="store-public-page" aria-labelledby="staff-store-title">
      <header className="store-public-header">
        <h1 id="staff-store-title">{store.name}</h1>
        {store.description && <p>{store.description}</p>}
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        {canManageProducts && store.status !== 'BLOCKED' && (
          <Button asChild variant="outline">
            <Link to="/store/products">{t('stores.productsTitle')}</Link>
          </Button>
        )}
        {canReadOrders && store.status !== 'BLOCKED' && (
          <Button asChild variant="outline">
            <Link to="/store/orders">{t('storeOrders.title')}</Link>
          </Button>
        )}
        {canCreateProduct && store.status !== 'BLOCKED' && (
          <Button asChild>
            <Link to="/store/products/new">{t('products.create.pageTitle')}</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to={`/stores/${encodeURIComponent(storeId)}`}>{t('stores.viewPublic')}</Link>
        </Button>
      </div>
    </section>
  )
}
