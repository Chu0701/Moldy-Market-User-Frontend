import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'

import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks/useSession'
import { useStoreStaff } from '@/features/stores/hooks/useStoreStaff'
import { AddStoreStaffForm } from '@/features/stores/components/AddStoreStaffForm'
import { StoreStaffPermissionsEditor } from '@/features/stores/components/StoreStaffPermissionsEditor'
import { StoreStaffRemoveButton } from '@/features/stores/components/StoreStaffRemoveButton'

export function StoreStaffPage() {
  const { t } = useTranslation()
  const { profileQuery } = useSession()
  const profile = profileQuery.data
  const userId = profile?.permissions?.includes('STORE_STAFF_MANAGE') ? profile.id : undefined
  const staffQuery = useStoreStaff(userId)
  const { data: staff = [], error } = staffQuery

  if (!userId || (error?.status === 403 && error.code !== 'STORE_BLOCKED')) {
    return <ForbiddenState />
  }

  if (error?.status === 404 && error.code === 'STORE_NOT_FOUND') {
    return <Navigate to="/open-store" replace />
  }

  return (
    <section className="grid w-full max-w-4xl gap-6" aria-labelledby="store-staff-title">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="store-staff-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('stores.staff.title')}
        </h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/store">{t('stores.profile.back')}</Link>
        </Button>
      </header>

      {staffQuery.isSuccess && <AddStoreStaffForm key={userId} userId={userId} />}

      {staffQuery.isPending ? (
        <p role="status">{t('stores.staff.loading')}</p>
      ) : error?.code === 'STORE_BLOCKED' ? (
        <p role="alert">{t('stores.unavailableTitle')}</p>
      ) : staffQuery.isError ? (
        <ErrorState
          title={t('stores.staff.loadError')}
          description={t('feedback.checkBack')}
          onRetry={() => void staffQuery.refetch()}
          isRetrying={staffQuery.isFetching}
        />
      ) : staff.length === 0 ? (
        <EmptyState
          title={t('stores.staff.emptyTitle')}
          description={t('stores.staff.emptyDescription')}
        />
      ) : (
        <div className="kn-table-card">
          <div className="kn-table-toolbar">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-sm font-semibold tracking-tight">{t('stores.staff.title')}</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t('table.rowsCount', { count: staff.length })}
              </span>
            </div>
          </div>

          <ul className="divide-y divide-border" aria-labelledby="store-staff-title">
            {staff.map((member) => {
              const displayName = member.fullName || member.email
              const initial = displayName?.trim()?.charAt(0)?.toUpperCase() || '?'
              return (
                <li key={member.id} className="grid min-w-0 gap-3 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-subtle text-xs font-semibold text-foreground"
                      aria-hidden="true"
                    >
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-semibold text-foreground">
                        {displayName}
                      </h2>
                      {member.fullName && (
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t('stores.staff.permissions')}
                    </p>
                    <p className="font-mono text-xs break-words text-foreground">
                      {member.permissions.length > 0
                        ? member.permissions.join(', ')
                        : t('stores.staff.noPermissions')}
                    </p>
                  </div>
                  <StoreStaffPermissionsEditor key={userId} userId={userId} member={member} />
                  <StoreStaffRemoveButton userId={userId} staffId={member.id} name={displayName} />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
