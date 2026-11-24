import { Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** @param {{ title: string, description: string }} props */
export function EmptyState({ title, description }) {
  const { t } = useTranslation()

  return (
    <div className="col-span-full flex w-full min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle/60 px-6 py-10 text-center text-balance">
      <span
        aria-hidden="true"
        className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-foreground"
      >
        <Inbox className="size-5" />
      </span>
      <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{t('feedback.checkBack')}</p>
    </div>
  )
}
