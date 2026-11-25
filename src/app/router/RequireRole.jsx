import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { ForbiddenState } from '@/components/feedback/ForbiddenState'
import { useSession } from '@/features/auth/hooks/useSession'

export function RequireRole({ role = 'APPRAISER' }) {
  const { t } = useTranslation()
  const { profileQuery } = useSession()

  if (profileQuery.isPending) {
    return <p role="status">{t('feedback.loading')}</p>
  }

  if (!profileQuery.data?.roles?.includes(role)) {
    return <ForbiddenState />
  }

  return <Outlet />
}
