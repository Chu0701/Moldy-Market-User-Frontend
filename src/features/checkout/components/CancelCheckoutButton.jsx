import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  getCancellableCheckoutOrder,
  getCancelCheckoutErrorKey,
} from '@/features/checkout/cancelCheckout'

/** @param {{ checkout: object, mutation: object, disabled?: boolean }} props */
export function CancelCheckoutButton({ checkout, mutation, disabled = false }) {
  const { t } = useTranslation()
  const locked = useRef(false)
  const orderId = getCancellableCheckoutOrder(checkout, mutation.userId)
  if (!orderId && !mutation.error) return null

  async function confirmCancel() {
    if (locked.current || disabled || mutation.isPending || !orderId) return
    if (!window.confirm(t('checkoutCancel.confirm', { count: checkout.orders.length }))) return
    locked.current = true
    try {
      await mutation.mutateAsync()
    } catch {
      //The mutation exposes a translated error and refetches the canonical state.
    } finally {
      locked.current = false
    }
  }

  return (
    <div className="grid justify-items-start gap-3">
      {orderId && (
        <>
          <p className="text-sm text-muted-foreground">{t('checkoutCancel.hint')}</p>
          <Button
            type="button"
            variant="destructive"
            disabled={disabled || mutation.isPending}
            onClick={() => void confirmCancel()}
          >
            {t(mutation.isPending ? 'checkoutCancel.pending' : 'checkoutCancel.action')}
          </Button>
        </>
      )}
      {mutation.error && (
        <p role="alert" className="checkout-error">
          {t(getCancelCheckoutErrorKey(mutation.error))}
        </p>
      )}
    </div>
  )
}
