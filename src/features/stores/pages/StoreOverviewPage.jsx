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

  const isBlocked = store.status === 'BLOCKED'

  return (
    <section className="store-public-page space-y-6" aria-labelledby="my-store-title">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0 space-y-1.5">
          <h1 id="my-store-title">{store.name}</h1>
          {store.description && (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{store.description}</p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={`/stores/${encodeURIComponent(store.id)}`}>{t('stores.viewPublic')}</Link>
        </Button>
      </header>

      {state?.storeProfileSaved === true && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm font-medium text-foreground"
        >
          {t('stores.profile.saved')}
        </p>
      )}

      <dl className="kn-stats-band sm:grid-cols-2">
        <div className="kn-stat-cell">
          <dt className="text-xs font-medium text-muted-foreground">
            {t('stores.dashboard.statusLabel')}
          </dt>
          <dd className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span
              className={`size-2 rounded-full ${isBlocked ? 'bg-destructive' : 'bg-success'}`}
              aria-hidden="true"
            />
            {store.status ?? 'ACTIVE'}
          </dd>
        </div>
        {store.pickupAddress && (
          <div className="kn-stat-cell">
            <dt className="text-xs font-medium text-muted-foreground">
              {t('stores.profile.pickupAddress')}
            </dt>
            <dd className="text-sm font-medium break-words text-foreground">
              {store.pickupAddress}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
