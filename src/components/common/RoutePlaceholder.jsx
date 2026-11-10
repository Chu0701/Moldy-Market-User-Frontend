import { useTranslation } from 'react-i18next'

/** @param {{ titleKey: string }} props */
export function RoutePlaceholder({ titleKey }) {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground sm:p-10">
      <p className="text-sm text-muted-foreground">{t('shell.phase')}</p>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{t(titleKey)}</h1>
      <p className="mt-4 max-w-xl leading-7 text-muted-foreground">{t('shell.placeholder')}</p>
    </section>
  )
}
