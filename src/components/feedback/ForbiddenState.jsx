import { useTranslation } from 'react-i18next'

export function ForbiddenState() {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className="col-span-full rounded-xl border border-border px-4 py-10 text-center sm:px-6"
    >
      <h3 className="text-xl font-semibold text-foreground">{t('feedback.forbiddenTitle')}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        {t('feedback.forbiddenMessage')}
      </p>
    </div>
  )
}
