import { useTranslation } from 'react-i18next'

/** @param {{ title: string, description: string }} props */
export function EmptyState({ title, description }) {
  const { t } = useTranslation()

  return (
    <div className="col-span-full rounded-xl border border-border bg-muted px-4 py-10 text-center sm:px-6">
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <p className="mt-3 text-sm text-muted-foreground">{t('feedback.checkBack')}</p>
    </div>
  )
}
