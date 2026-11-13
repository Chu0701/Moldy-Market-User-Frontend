import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useSession } from '@/features/auth/hooks/useSession'
import { OpenStoreForm } from '@/features/stores/components/OpenStoreForm'
import { useMyStore } from '@/features/stores/hooks/useMyStore'

export function OpenStorePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const storeQuery = useMyStore(userId)

  function goToStore() {
    void navigate('/store', { replace: true })
  }

  function handleExistingStore() {
    void storeQuery.refetch()
  }

  if (storeQuery.data) {
    return <Navigate to="/store" replace />
  }

  return (
    <section className="open-store-page" aria-labelledby="open-store-title">
      <h1 id="open-store-title">{t('stores.open.title')}</h1>

      {!userId || storeQuery.error?.status === 403 ? (
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
      ) : (
        <OpenStoreForm
          key={userId}
          userId={userId}
          onCreated={goToStore}
          onExistingStore={handleExistingStore}
        />
      )}
    </section>
  )
}
