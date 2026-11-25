import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

/** @param {{ label: string, title: string, description: string, confirmLabel: string, onConfirm: () => Promise<unknown>, disabled?: boolean, variant?: string }} props */
export function ConfirmActionButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled = false,
  variant = 'outline',
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function confirm() {
    setIsSubmitting(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      // The parent action handler renders its own localized error state.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button type="button" variant={variant} disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="appraiser-confirm-title"
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg sm:p-6"
          >
            <h2 id="appraiser-confirm-title" className="text-xl font-semibold">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
              >
                {t('actions.cancel')}
              </Button>
              <Button
                type="button"
                disabled={disabled || isSubmitting}
                onClick={() => void confirm()}
              >
                {isSubmitting ? t('navigation.loading') : confirmLabel}
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
