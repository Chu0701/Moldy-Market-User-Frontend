import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation } from 'react-router'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useSession } from '@/features/auth/hooks/useSession'
import { useMyStore } from '@/features/stores/hooks/useMyStore'
import { Button } from '@/components/ui/button'
import { StaffStoreOverview } from '@/features/stores/components/StaffStoreOverview'
import { getStoreContext } from '@/features/stores/getStoreContext'

export function StoreOverviewPage() {
  const { profileQuery } = useSession()
  const profile = profileQuery.data
  const store = getStoreContext(profile)

  if (store.kind === 'staff') {
    return <StaffStoreOverview profile={profile} />
  }

  return <OwnerStoreOverview profile={profile} />
}

function OwnerStoreOverview({ profile }) {
  const { t } = useTranslation()
  const { state } = useLocation()
  const userId = profile?.id
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

      <dl className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t('stores.dashboard.statusLabel')}</dt>
          <dd className="mt-1 font-medium">{store.status ?? 'ACTIVE'}</dd>
        </div>
        {store.pickupAddress && (
          <div>
            <dt className="text-muted-foreground">{t('stores.profile.pickupAddress')}</dt>
            <dd className="mt-1 font-medium">{store.pickupAddress}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link to={`/stores/${encodeURIComponent(store.id)}`}>{t('stores.viewPublic')}</Link>
        </Button>
      </div>
    </section>
  )
}
