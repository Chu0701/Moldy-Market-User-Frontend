import { useTranslation } from 'react-i18next'

export function AdminCommissionUnavailablePage() {
  const { t } = useTranslation()
  return (
    <main className="space-y-3">
      <h1>{t('adminAppraisers.commissionsTitle')}</h1>
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-semibold">{t('adminAppraisers.commissionsUnavailableTitle')}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('adminAppraisers.commissionsUnavailableDescription')}
        </p>
      </section>
    </main>
  )
}
