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
    <section className="grid w-full max-w-3xl gap-6" aria-labelledby="store-staff-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 id="store-staff-title">{t('stores.staff.title')}</h1>
        <Button asChild variant="outline">
          <Link to="/store">{t('stores.profile.back')}</Link>
        </Button>
      </div>

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
        <ul className="grid gap-3" aria-labelledby="store-staff-title">
          {staff.map((member) => (
            <li key={member.id} className="min-w-0 rounded-xl border border-border p-4">
              <h2 className="break-words font-semibold">{member.fullName || member.email}</h2>
              {member.fullName && (
                <p className="break-words text-sm text-muted-foreground">{member.email}</p>
              )}
              <p className="mt-3 text-sm font-medium">{t('stores.staff.permissions')}</p>
              <p className="break-words text-sm text-muted-foreground">
                {member.permissions.length > 0
                  ? member.permissions.join(', ')
                  : t('stores.staff.noPermissions')}
              </p>
              <StoreStaffPermissionsEditor key={userId} userId={userId} member={member} />
              <StoreStaffRemoveButton
                userId={userId}
                staffId={member.id}
                name={member.fullName || member.email}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
