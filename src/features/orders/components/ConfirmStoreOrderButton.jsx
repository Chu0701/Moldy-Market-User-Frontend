import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/**
 * @param {{
 *   order: object,
 *   mutation: object,
 *   canConfirm: boolean,
 *   disabled?: boolean,
 *   size?: 'sm' | 'default',
 * }} props
 */
export function ConfirmStoreOrderButton({
  order,
  mutation,
  canConfirm,
  disabled = false,
  size = 'sm',
}) {
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
  async function confirm(event) {
    event?.stopPropagation?.()
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
      size={size}
      className={
        size === 'sm'
          ? 'h-8 shrink-0 px-3.5 text-xs whitespace-nowrap'
          : 'min-h-10 shrink-0 whitespace-nowrap'
      }
      disabled={disabled || mutation.isPending || (sameOrder && mutation.isSuccess)}
      onClick={(event) => void confirm(event)}
    >
      {t(sameOrder && mutation.isPending ? 'storeOrders.confirming' : 'storeOrders.confirm')}
    </Button>
  )
}
