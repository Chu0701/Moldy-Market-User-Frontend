import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function Logo() {
  const { t } = useTranslation()

  return (
    <Link
      to="/"
      className="inline-flex min-h-11 items-center rounded-md font-heading text-xl font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-2xl"
    >
      {t('app.name')}
    </Link>
  )
}
