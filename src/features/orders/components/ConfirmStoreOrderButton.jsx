import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/** @param {{ order: object, mutation: object, canConfirm: boolean, disabled?: boolean }} props */
export function ConfirmStoreOrderButton({ order, mutation, canConfirm, disabled = false }) {
  const { t } = useTranslation()
  const locked = useRef(false)
  if (
    !canConfirm ||
    order.status !== 'PENDING_CONFIRMED' ||
    order.paymentMethod !== 'COD' ||
    order.paymentStatus !== 'PENDING'
  )
    return null
  const sameOrder = mutation.variables?.orderId === order.id
  async function confirm() {
    if (locked.current || disabled || mutation.isPending) return
    if (!window.confirm(t('storeOrders.confirmPrompt', { code: order.orderCode }))) return
    locked.current = true
    try {
      const result = await mutation.confirmOrder(order.id)
      if (!result) locked.current = false
    } catch {
      // The page translates the mutation error; canonical list data is refetched.
      locked.current = false
    }
  }
  return (
    <Button
      type="button"
      className="min-h-11"
      disabled={disabled || mutation.isPending || (sameOrder && mutation.isSuccess)}
      onClick={() => void confirm()}
    >
      {t(sameOrder && mutation.isPending ? 'storeOrders.confirming' : 'storeOrders.confirm')}
    </Button>
  )
}
