import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation } from 'react-router'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useSession } from '@/features/auth/hooks/useSession'
import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { Button } from '@/components/ui/button'

export function StoreOverviewPage() {
  const { t } = useTranslation()
  const { state } = useLocation()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const storeQuery = useMyStore(userId)
  const store = storeQuery.data

  if (!userId || storeQuery.error?.status === 403) {
    return <ForbiddenState />
  }

  if (storeQuery.isPending) {
    return <p role="status">{t('stores.loading')}</p>
  }

  if (storeQuery.isError) {
    return (
      <ErrorState
        title={t('stores.loadError')}
        description={t('feedback.checkBack')}
        onRetry={() => void storeQuery.refetch()}
        isRetrying={storeQuery.isFetching}
      />
    )
  }

  if (store === null) {
    return <Navigate to="/open-store" replace />
  }

  return (
    <section className="store-public-page" aria-labelledby="my-store-title">
      <header className="store-public-header">
        <h1 id="my-store-title">{store.name}</h1>
        {store.description && <p>{store.description}</p>}
      </header>

      {state?.storeProfileSaved === true && <p role="status">{t('stores.profile.saved')}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to="/store/profile">{t('stores.profile.title')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/store/products">{t('stores.productsTitle')}</Link>
        </Button>
      </div>
    </section>
  )
}
