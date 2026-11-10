import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { RoutePlaceholder } from '@/components/common/RoutePlaceholder'

export function LoginPage() {
  const { t } = useTranslation()

  return (
    <>
      <RoutePlaceholder titleKey="navigation.login" />
      <Link
        to="/register"
        className="mt-4 inline-flex min-h-11 items-center self-center rounded-md px-4 text-sm underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t('navigation.register')}
      </Link>
    </>
  )
}
