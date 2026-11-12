import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router'

import { ErrorState } from '@/components/feedback/ErrorState'
import { useSession } from '@/features/auth/hooks/useSession'
import { getAccessToken } from '@/lib/tokenStorage'

export function GuestOnly() {
  const { t } = useTranslation()
  const [shouldCheck, setShouldCheck] = useState(() => Boolean(getAccessToken()))
  const { hasAccessToken, profileQuery } = useSession({ enabled: shouldCheck })

  if (!shouldCheck) return <Outlet />

  if (!hasAccessToken) {
    setShouldCheck(false)
    return null
  }
  if (profileQuery.isPending) {
    return <p role="status">{t('feedback.loading')}</p>
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        title={t('feedback.errorTitle')}
        description={t('feedback.checkBack')}
        onRetry={() => void profileQuery.refetch()}
        isRetrying={profileQuery.isFetching}
      />
    )
  }

  return <Navigate to="/" replace />
}
