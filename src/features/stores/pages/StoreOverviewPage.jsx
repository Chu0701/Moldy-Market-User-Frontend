import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useSession } from '@/features/auth/hooks/useSession'
import { useMyStore } from '@/features/stores/hooks/useMyStore'

export function StoreOverviewPage() {
  const { t } = useTranslation()
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
    </section>
  )
}
