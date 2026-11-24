import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

/**
 * @param {{ title: string, description: string, onRetry: () => void,
 * isRetrying?: boolean }} props
 */
export function ErrorState({ title, description, onRetry, isRetrying = false }) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      aria-busy={isRetrying}
      className="col-span-full flex w-full min-w-0 flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-10 text-center text-balance shadow-xs"
    >
      <span
        aria-hidden="true"
        className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
      >
        <AlertCircle className="size-5" />
      </span>
      <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-5 min-h-11"
        disabled={isRetrying}
        onClick={onRetry}
      >
        {t('actions.retry')}
      </Button>
    </div>
  )
}
