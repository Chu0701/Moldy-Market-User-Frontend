import { useTranslation } from 'react-i18next'

export function RouteLoading() {
  const { t } = useTranslation()

  return (
    <div role="status" className="min-h-dvh bg-background p-8 text-muted-foreground">
      {t('feedback.loading')}
    </div>
  )
}
