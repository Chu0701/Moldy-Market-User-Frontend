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
      className="col-span-full rounded-xl border border-border px-4 py-10 text-center sm:px-6"
    >
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-6 min-h-11"
        disabled={isRetrying}
        onClick={onRetry}
      >
        {t('actions.retry')}
      </Button>
    </div>
  )
}
