import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useSession } from '@/features/auth/hooks/useSession'

export function RequireAuth() {
  const { t } = useTranslation()
  const { pathname, search, hash } = useLocation()
  const { hasAccessToken, profileQuery } = useSession()

  if (!hasAccessToken) {
    return <Navigate to="/login" replace state={{ from: `${pathname}${search}${hash}` }} />
  }

  if (profileQuery.isPending) {
    return <p role="status">{t('feedback.loading')}</p>
  }

  if (profileQuery.isError) {
    if (profileQuery.error?.status === 403) return <ForbiddenState />

    return (
      <ErrorState
        title={t('feedback.errorTitle')}
        description={t('feedback.checkBack')}
        onRetry={() => void profileQuery.refetch()}
        isRetrying={profileQuery.isFetching}
      />
    )
  }

  return <Outlet />
}
