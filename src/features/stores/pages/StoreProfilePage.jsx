import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { StoreProfileForm } from '@/features/stores/components/StoreProfileForm'
import { useMyStore } from '@/features/stores/hooks/useMyStore'

export function StoreProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profileQuery } = useSession()
  const userId = profileQuery.data?.id
  const storeQuery = useMyStore(userId)
  const store = storeQuery.data

  function handleSaved() {
    void navigate('/store', { replace: true, state: { storeProfileSaved: true } })
  }

  if (!userId) return <ForbiddenState />

  if (storeQuery.isPending) {
    return <p role="status">{t('stores.loading')}</p>
  }

  if (store?.status === 'BLOCKED' || storeQuery.error?.code === 'STORE_BLOCKED') {
    return (
      <section className="open-store-page" aria-labelledby="store-profile-title">
        <h1 id="store-profile-title">{t('stores.profile.title')}</h1>
        <p role="alert">{t('stores.profile.blocked')}</p>
        <Button asChild variant="outline">
          <Link to="/store">{t('stores.profile.back')}</Link>
        </Button>
      </section>
    )
  }

  if (storeQuery.error?.status === 403) return <ForbiddenState />

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

  if (store === null) return <Navigate to="/open-store" replace />

  return (
    <section className="open-store-page" aria-labelledby="store-profile-title">
      <h1 id="store-profile-title">{t('stores.profile.title')}</h1>
      <StoreProfileForm key={store.id} userId={userId} store={store} onSaved={handleSaved} />
    </section>
  )
}
