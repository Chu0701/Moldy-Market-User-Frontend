import { ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ForbiddenState() {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className="col-span-full flex w-full min-w-0 flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-10 text-center text-balance shadow-xs"
    >
      <span
        aria-hidden="true"
        className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-muted text-foreground"
      >
        <ShieldAlert className="size-5" />
      </span>
      <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
        {t('feedback.forbiddenTitle')}
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t('feedback.forbiddenMessage')}
      </p>
    </div>
  )
}
