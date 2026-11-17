import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { usePublicStore } from '@/features/stores/hooks/usePublicStore'

/** @param {{ storeId: string, canCreateProduct: boolean }} props */
export function StaffStoreOverview({ storeId, canCreateProduct }) {
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
        {canCreateProduct && (
          <Button asChild>
            <Link to="/store/products/new">{t('products.create.pageTitle')}</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to={`/stores/${encodeURIComponent(storeId)}`}>
            {t('products.seller.viewStore')}
          </Link>
        </Button>
      </div>
    </section>
  )
}
