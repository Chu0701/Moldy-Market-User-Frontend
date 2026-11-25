import { CircleDashed } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** @param {{ title: string, description: string }} props */
export function AppraiserUnavailableState({ title, description }) {
  const { t } = useTranslation()

  return (
    <section
      role="status"
      aria-label={t('appraiser.unavailableState')}
      className="flex items-start gap-4 rounded-lg border border-dashed border-border bg-card p-4 sm:p-5"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CircleDashed aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 pt-0.5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  )
}
